var mongoose = require("mongoose");

var itemSchema = new mongoose.Schema({
	name: String,
	image: String,
	store: String,
	type: String,
	amount: Number,
	listCount:Number,
	index: Number
})

module.exports = mongoose.model("Item", itemSchema);