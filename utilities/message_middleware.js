const common_data = require("./common_variables.js");

let {
    nicknames,
    assignedNicknames,
    games
} = common_data;

function moderationMessage(msg, group, game) {
	switch (group) {
		case "all":
			io.in(`${game.gameID}`).emit("chat message", msg);
		default:
			if (group in nicknames) {
				io.to(`${group.ID}`).emit("chat message", msg);
			}
	}
}

module.exports.modMessage = moderationMessage;
module.exports.socketIO = io;