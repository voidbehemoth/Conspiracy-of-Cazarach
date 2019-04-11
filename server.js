const express = require("express");
const app = express();
const server = require("http").createServer(app);
const ip = require("ip");
const PORT = process.env.PORT || 8001;
const session = require("express-session");
const roles = require("./utilities/roles.js");
const io = require("./utilities/socket_setup.js");
// const cors = require("cors")
require("./utilities/upgraded_console.js").init("dev");
const logger = require("./utilities/upgraded_console.js").exported_logger;
console.log(logger);

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
    logger.dev("This message will only show up if in development")
    next();
});

app.get("/login", (request, response) => {
    response.sendFile(__dirname + "/public_files/login.html");
});

app.post("/play", (request, response) => {
    response.redirect("/play");
});

app.get("/play", (request, response) => {
    response.sendFile(__dirname + "/public_files/play.html");
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













server.listen(PORT, () => {
    console.log(
        `
        =====================================================================================================
        Go to your web broswer and type in ${ip.address()}:${PORT} to see server
        =====================================================================================================
    `);
});