const express = require("express");
const app = express();
const server = require("http").createServer(app);
const ip = require("ip");
const PORT = process.env.PORT || 8001;
const session = require("express-session");
const roles = require("./utilities/roles.js");
const io = require("socket.io")();
// const cors = require("cors")
var nicknames = {};
var assignedNicknames = ["Indiana Jones", "Will Smith", "Bob Ross", "John Smith", "Jeff Mcjefferson"]
var games = {};

app.use(express.static("public_files"));
app.use(express.urlencoded({
    extended: true
}));

app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true
    }
}));
// app.use(cors());
app.use(function (request, response, next) {
    request.session.random_number = Math.random();
    console.log(request.session);

    if (request.session.views) {
        request.session.views++;
    } else {
        request.session.views = 1;
    }
    next();
});

app.get("/login", (request, response) => {
    response.sendFile(__dirname + "/public_files/login.html");
});

app.post("/play", (request, response) => {
    console.log("Recieved login request, details below:");
    console.log(request.body);
    response.redirect("/play");
});

app.get("/play", (request, response) => {
    response.sendFile(__dirname + "/public_files/play.html");
    console.log(`recieved request for /play from ${request.ip}`);
    if (request.session.page_views) {
        request.session.page_views++;
        console.log(`this person has viewed this page ` + request.session.views + ` times`);
    } else {
        request.session.page_views = 1;
        console.log(`this person is new to the page!`);
    }
});

app.get("/all_roles", (request, response) => {
    const elliot_roles = roles.allRoles;
    response.json(elliot_roles);
});

app.get("/randomrole", (request, response) => {
    response.sendFile(__dirname + "/public_files/randomrole.html");
});
app.get("/randomrole.json", (request, response) => {
    response.json(roles.getRandomRole());
});
app.get("/socket-test", (request, response) => {
    response.sendFile(__dirname + "/public_files/play.html");
});














//SOCKET SETUP

io.attach(server);

io.on("connection", function (socket) {
    nicknames[`${socket.id}`] = `${socket.id}`
    console.log(`${socket.id} has connected to the server!`);
    socket.emit("chat message", `Your randomly generated user ID is ${nicknames[socket.id]}`)
    socket.emit("chat message", `You aren't currently in a game, type: "/join" to join a game, or type "/create-game" to create a game \n Bored? Type "/leave" to leave this game. Do note that you cannot rejoin once you leave a game.`)

    function runGame(game) {
        if (game.cycle === "prep") {
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: Everyone must now pick a nickname using the /nickname command`);
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: If you fail to do so within 30 seconds you will be assigned a nickname`);
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: You will be unable to chat until you have picked a nickname`);
            game.nicknameGatheringMode = true;
            setTimeout(function () {
                io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 15 seconds left...`)
                setTimeout(function () {
                    io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 10 seconds left...`)
                    setTimeout(function () {
                        io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 5 seconds left...`)
                        setTimeout(function () {
                            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 4 seconds left...`)
                            setTimeout(function () {
                                io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 3 seconds left...`)
                                setTimeout(function () {
                                    io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 2 seconds left...`)
                                    setTimeout(function () {
                                        io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 1 seconds left...`)
                                        setTimeout(function () {
                                            nickentries = Object.entries(nicknames);
                                            for (var i = 0; i < nickentries.length; i++) {
                                                if (nickentries[i][0] === nickentries[i][1]) {
                                                    var newNickname = assignedNicknames[Math.floor(Math.random() * assignedNicknames.length)];
                                                    nicknames[nickentries[i][0]] = newNickname;
                                                    io.to(`${nickentries[i][0]}`).emit("chat message", `You have been assigned ${newNickname} out of the pool of random nicknames`);
                                                }
                                            }
                                            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: All players who didn't assign themselves a nickname have now been assigned one.`)
                                        }, 1000)
                                    }, 1000)
                                }, 1000)
                            }, 1000)
                        }, 1000)
                    }, 5000)
                }, 5000)
            }, 15000)
        }
    }
    socket.on("chat message", function (msg) {
        if (msg.startsWith("/play") || msg.startsWith("/join") || msg.startsWith("/begin") || msg.startsWith("/queue")) {
            if (Object.keys(games).length > 0) {
                for (const game in games) {
                    var ingame = false;
                    if (Object.keys(games[game].players).includes(socket.id)) {
                        ingame = true;
                    }
                    if (game == (Object.keys(games).length - 1)) {
                        if (!(ingame)) {
                            if (games[game].playerCap > Object.keys(games[game].players).length) {
                                games[game].players[socket.id] = {
                                    "playerID": socket.id,
                                    "role": "Unassigned",
                                    "alive": true,
                                    "probed": false,
                                    "will": ""
                                }
                                io.in(`${game}`).emit('chat message', `--> ${nicknames[socket.id]} has joined the server`);
                                io.in(`${game}`).emit('chat message', `Waiting for ${(games[game].playerCap - Object.keys(games[game].players).length)} more players...`);
                                io.to(`${games[game].creator}`).emit('chat message', 'Type "/start" at any time to start the game with the current players in queue');
                                socket.join(`${games[game].gameID}`);
                                socket.emit("join success", games[game]);
                            } else {
                                socket.emit("game full", games[game].gameID)
                            }
                        } else {
                            socket.emit("ingame", games[game].gameID)
                        }
                    }
                }
            } else {
                socket.emit("zero games")
            }
        } else {
            if (msg.startsWith("/new") || msg.startsWith("/create-game") || msg.startsWith("/create_game") || msg.startsWith("/create-server") || msg.startsWith("/create_server")) {
                var gamemode;
                var playerCap;
                splitMsg = msg.split(" ");
                if (splitMsg.length > 2) {
                    gamemode = splitMsg[1];
                    playerCap = splitMsg[2];
                } else {
                    if (splitMsg.length > 1) {
                        gamemode = splitMsg[1]
                        playerCap = 15;
                    } else {
                        gamemode = "classic";
                        playerCap = 15;
                    }
                }
                var ingame = false;
                for (const game in games) {
                    if (Object.keys(games[game].players).includes(socket.id)) {
                        ingame = true;
                    }
                }
                if (!(ingame)) {
                    var newGame = Object.keys(games).length;
                    games[newGame] = {
                        "gameID": newGame,
                        "gamemode": gamemode,
                        "playerCap": playerCap,
                        "players": {},
                        "gameLog": [],
                        "cycle": "prep",
                        "creator": socket.id,
                        "nicknameGatheringMode": false
                    }
                    games[newGame].players[socket.id] = {
                        "playerID": socket.id,
                        "role": "Unassigned",
                        "alive": true,
                        "probed": false,
                        "will": ""
                    }
                    console.log(games[newGame].players);

                    socket.join(`${games[newGame].gameID}`);
                    socket.emit("create success", games[newGame].gameID)
                } else {
                    socket.emit("create_ingame", newGame)
                }
            } else {
                if (msg.startsWith("/leave") || msg.startsWith("/exit") || msg.startsWith("/go")) {
                    for (const game in games) {
                        if (Object.keys(games[game].players).includes(socket.id)) {
                            io.in(`${game}`).emit('chat message', `${nicknames[socket.id]} has left the game <--`);
                            socket.leave(games[game].gameID);
                            socket.emit("left game", games[game].gameID)
                            delete games[game].players[socket.id];
                            if (Object.keys(games).length < 1) {
                                delete games[game];
                            }
                        }
                    }
                } else {
                    var creator = false;
                    for (const game in games) {
                        if (games[game].creator === socket.id) {
                            creator = true;
                        }
                    }
                    if (msg.startsWith("/start") && creator) {
                        for (const game in games) {
                            if (Object.keys(games[game].players).includes(socket.id)) {
                                runGame(games[game]);
                            }
                        }
                    } else {
                        if (msg.startsWith("/nickname ") || msg.startsWith("/nick ") || msg.startsWith("/n ")) {
                            var splitMsg = msg.split(" ");
                            if (splitMsg.length > 1) {
                                splitMsg.shift();
                                if (!(splitMsg[0] === "MOD" || splitMsg[0] === "mod" || splitMsg[0] === "MODERATOR" || splitMsg[0] === "moderator" || splitMsg[0] === "AUTOMODERATOR" || splitMsg[0] === "automoderator")) {
                                    var newNickname = "";
                                    for (const word of splitMsg) {
                                        if (!(word === 0)) {
                                            newNickname.concat(` ${splitMsg[word]}`)
                                        } else {
                                            newNickname.concat(`${splitMsg[word]}`)
                                        }
                                    }
                                    nicknames[socket.id] = newNickname;
                                } else {
                                    socket.emit("chat message", `Be careful, it's illegal to impersonate authority`);
                                }
                            } else {
                                var newNickname = assignedNicknames[Math.floor(Math.random() * assignedNicknames.length)];
                                nicknames[socket.id] = newNickname;
                                socket.emit("chat message", `You have been assigned ${newNickname} out of the pool of random nicknames`);
                            }
                        } else {
                            if (msg.startsWith("/help")) {
                                socket.emit("chat message", `List of valid commands with syntax and descriptions:`)
                                socket.emit("chat message", `- "/join": Allows you to join a game that needs more people`)
                                socket.emit("chat message", `- "/create-game [gamemode] [playerCap]": Allows you to create a game for people to join. The gamemode if not specified will be set to Classic and the playerCap will be set to 15 if not specified.`)
                                socket.emit("chat message", `- "/leave": Allows you to leave a game. Do note that there is no current way to re-join a game after it starts.`)
                                socket.emit("chat message", `- "/help": The command that you're using right now. Use it to get a list of commands with proper syntax and descriptions.`)
                            } else {
                                if (msg.startsWith("/")) {
                                    socket.emit("chat message", `It appears that you use the prefix for a command ("/") but you didn't use any valid commands. If you need help with commands then please enter "/help"`)
                                } else {
                                    console.log(`${socket.id}: ` + msg);
                                    var ingame = false;
                                    for (const game in games) {
                                        if (Object.keys(games[game].players).includes(socket.id)) {
                                            ingame = true;
                                            if (!(games[game].nicknameGatheringMode)) {
                                                io.in(`${game}`).emit('chat message', `(${Object.keys(nicknames).indexOf(socket.id) + 1}) ${nicknames[socket.id]}: ${msg}`);
                                                games[game].gameLog[games[game].gameLog.length] = `${nicknames[socket.id]}: ${msg}`;
                                            } else {
                                                if (socket.id === nicknames[socket.id]) {
                                                    socket.emit('chat message', `Your message could not be delivered, as you haven't set your nickname yet`);
                                                } else {
                                                    io.in(`${game}`).emit('chat message', `(${Object.keys(games[game].players).indexOf(socket.id) + 1}) ${nicknames[socket.id]}: ${msg}`);
                                                    games[game].gameLog[games[game].gameLog.length] = `${nicknames[socket.id]}: ${msg}`;
                                                }
                                            }
                                        }
                                    }
                                    if (!(ingame)) {
                                        socket.emit('chat message', `${nicknames[socket.id]}: ${msg}`)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    /*
        socket.on("join game", function () {
            if (Object.keys(games).length > 0) {
                for (const game in games) {
                    var ingame = false;
                    if (Object.keys(games[game].players).includes(socket.id)) {
                        ingame = true;
                    }
                    if (game == (Object.keys(games).length - 1)) {
                        if (!(ingame)) {
                            if (games[game].playerCap > Object.keys(games[game].players).length) {
                                games[game].players[socket.id] = {
                                    "playerID": socket.id,
                                    "role": "Unassigned",
                                    "alive": true,
                                    "probed": false,
                                    "will": ""
                                }
                                io.in(`${game}`).emit('chat message', `--> ${nicknames[socket.id]} has joined the server`);
                                io.in(`${game}`).emit('chat message', `Waiting for ${games[game].playerCap - games[game].players.length} more players...`);
                                console.log(games[game].players);
                                socket.join(`${games[game].gameID}`);
                                socket.emit("join success", games[game]);
                            } else {
                                socket.emit("game full", games[game].gameID)
                            }
                        } else {
                            socket.emit("ingame", games[game].gameID)
                        }
                    }
                }
            } else {
                socket.emit("zero games")
            }
        })

        socket.on("leave game", function () {
            for (const game in games) {
                if (Object.keys(games[game].players).includes(socket.id)) {
                    io.in(`${game}`).emit('chat message', `${nicknames[socket.id]} has left the game <--`);
                    socket.leave(games[game].gameID);
                    socket.emit("left game", games[game].gameID)
                    delete games[game].players[socket.id];
                    if (Object.keys(games).length < 1) {
                        delete games[game];
                    }
                }
            }
        })

        socket.on("new game", function (gamemode, playerCap) {
            var ingame = false;
            for (const game in games) {
                if (Object.keys(games[game].players).includes(socket.id)) {
                    ingame = true;
                }
            }
            if (!(ingame)) {
                var newGame = Object.keys(games).length;
                games[newGame] = {
                    "gameID": newGame,
                    "gamemode": gamemode,
                    "playerCap": playerCap,
                    "players": {},
                    "gameLog": []
                }
                games[newGame].players[socket.id] = {
                    "playerID": socket.id,
                    "role": "Unassigned",
                    "alive": true,
                    "probed": false,
                    "will": ""
                }
                console.log(games[newGame].players);
                socket.join(`${games[newGame].gameID}`);
                io.in(`${newGame}`).emit('chat message', `--> ${nicknames[socket.id]} has joined the server`);
                socket.emit("create success", newGame)
            } else {
                socket.emit("create_ingame", newGame)
            }
        })
        */
    socket.on('disconnect', function () {
        console.log('user disconnected');
        for (const game in games) {
            if (Object.keys(games[game].players).includes(socket.id)) {
                io.in(`${game}`).emit('chat message', `${nicknames[socket.id]} has left the game <--`);
                socket.leave(games[game].gameID);
                socket.emit("left game", games[game].gameID)
                delete games[game].players[socket.id];
                if (Object.keys(games).length < 1) {
                    delete games[game];
                }
            }
        }
    });
})




















server.listen(PORT, () => {
    console.log(
        `
        =====================================================================================================
        Go to your web broswer and type in ${ip.address()}:${PORT} to see server
        =====================================================================================================
    `);
});