var mongoose = require("mongoose");

var tokenSchema = new mongoose.Schema({
	refreshToken:String
})

module.exports = mongoose.model("Token", tokenSchema);