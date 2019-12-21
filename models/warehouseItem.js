var mongoose = require("mongoose");

var warehouseItemSchema = new mongoose.Schema({
	name: String,
	image: String,
	type: String,
	index: Number
})

module.exports = mongoose.model("warehouseItem", warehouseItemSchema);