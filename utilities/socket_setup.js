const io = require("socket.io")();
const common_data = require("./common_variables.js");

// This is object destructuring in JavaScript, and it is only available in ES6 and in any later version
// It would be equivelant to the code below
// let nicknames = common_data.nicknames;
// let assignedNicknames = common_data.assignedNicknames;
// let games = common_data.games;
let {
    nicknames,
    assignedNicknames,
    games
} = common_data;

// A self-implemented wait function. Only for use in async functions.
function wait(milliseconds) {
    return new Promise((resolve, reject ) => {
        setTimeout(()=>{
            resolve();
        },milliseconds)
    })
}

// Gets a player's object, which we can extract information from.
function getInfo(socket_ID) {
    // TODO
}

io.on("connection", function (socket) {
    // Will trigger when the user asks for information. Only for in-dev use.
    socket.on("status", () => {
        let status_object;



        socket.emit("status", status_object)
    })
    // Assigns the user a default username that is their socket ID
    nicknames[`${socket.id}`] = `${socket.id}`
    console.log(`${socket.id} has connected to the server!`);
    // Alerts the user of ther socket ID
    socket.emit("chat message", `Your randomly generated user ID is ${nicknames[socket.id]}`)
    // A little helpful message to tell the player what they can do.
    socket.emit("chat message", `You aren't currently in a game, type: "/join" to join a game, or type "/create-game" to create a game \n Bored? Type "/leave" to leave this game. Do note that you cannot rejoin once you leave a game.`)

    // A function to be called that will handle a cycle of a game. It will automatticaly detect what game cycle it is and handle it apropiately.
    async function runGame(game) {
        if (game.cycle === "prep") {
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: Everyone must now pick a nickname using the /nickname command`);
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: If you fail to do so within 30 seconds you will be assigned a nickname`);
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: You will be unable to chat until you have picked a nickname`);
            game.nicknameGatheringMode = true;
            wait(15000)
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 15 seconds left...`)
            wait(5000)
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 10 seconds left...`)
            wait(5000)
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 5 seconds left...`)
            wait(1000)
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 4 seconds left...`)
            wait(1000)
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 3 seconds left...`)
            wait(1000)
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 2 seconds left...`)
            wait(1000)
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: 1 seconds left...`)
            wait(1000)
            nickentries = Object.entries(nicknames);
            // Itetates through all users, checking if they have a nickname. 
            for (var i = 0; i < nickentries.length; i++) {
                if (nickentries[i][0] === nickentries[i][1]) {
                    var newNickname = assignedNicknames[Math.floor(Math.random() * assignedNicknames.length)];
                    nicknames[nickentries[i][0]] = newNickname;
                    io.to(`${nickentries[i][0]}`).emit("chat message", `You have been assigned ${newNickname} out of the pool of random nicknames`);
                }
            }
            io.in(`${game.gameID}`).emit('chat message', `AUTOMODERATOR: All players who didn't assign themselves a nickname have now been assigned one.`)
        }
    }
    socket.on("chat message", function (msg) {
        var splitMsg = msg.split();
        switch (splitMsg[0]) {
            case "/join" || "/new":
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
                break;
            case "/create-game":
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

                    socket.join(`${games[newGame].gameID}`);
                    socket.emit("create success", games[newGame].gameID)
                } else {
                    socket.emit("create_ingame", newGame)
                }
                break;
            case "/leave":
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
                break;
            case "/start":
                var creator = false;
                for (const game in games) {
                    if (games[game].creator === socket.id) {
                        creator = true;
                    }
                }
                if (creator) {
                    for (const game in games) {
                        if (Object.keys(games[game].players).includes(socket.id)) {
                            runGame(games[game]);
                        }
                    }
                }
                break;
            case "/nickname":
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
                break;
            case "/help":
                socket.emit("chat message", `List of valid commands with syntax and descriptions:`)
                socket.emit("chat message", `- "/join": Allows you to join a game that needs more people`)
                socket.emit("chat message", `- "/create-game [gamemode] [playerCap]": Allows you to create a game for people to join. The gamemode if not specified will be set to Classic and the playerCap will be set to 15 if not specified.`)
                socket.emit("chat message", `- "/leave": Allows you to leave a game. Do note that there is no current way to re-join a game after it starts.`)
                socket.emit("chat message", `- "/help": The command that you're using right now. Use it to get a list of commands with proper syntax and descriptions.`)
                break;
            default:
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
        })
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

module.exports = io;
console.log(`${__filename} loaded`);