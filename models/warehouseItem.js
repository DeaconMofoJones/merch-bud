var mongoose = require("mongoose");

var warehouseItemSchema = new mongoose.Schema({
	name: String,
	image: String,
	type: String,
	amount: Number,
	listCount:Number,
	index: Number
})

module.exports = mongoose.model("WarehouseItem", warehouseItemSchema);