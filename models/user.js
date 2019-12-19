var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
	username:String,
	password:String,
	items: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Item"
		}
	]
})

module.exports = mongoose.model("User", userSchema);