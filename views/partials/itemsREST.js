var itemSchema = new mongoose.Schema({
	name: String,
	image: String,
	store: String,
	type: String,
	amount: Number
})

var Item = mongoose.model("Item", itemSchema);

app.get("/", function(req,res){
	res.redirect("/items/store/foodco");
});

// app.get("/items", function(req,res){
// 	Item.find({}, function(err,items){
// 		if (err) {
// 			console.log("error in get /items: "+err);
// 		} else {
// 			res.render("index.ejs", {items:items,storeName:"All Stores"})
// 		}
// 	});
	
// });

app.get("/items/store/:storeName", function(req,res){
	Item.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			res.render("index.ejs", {items:items,storeName:req.params.storeName})
		}
	});
	
});


app.get("/items/new", function(req,res){
	res.render("newItem.ejs");
});

app.post("/items", function(req,res){
	Item.create(req.body.item, function(err, createdItem){
		if (err) {
			res.render("newItem.ejs");
		} else {
			res.redirect("/items");
		}
	})
});

app.get("/items/:id", function(req,res){
	Item.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log(err);
			res.send("error in get /items/:id: "+ err);
		} else {
			res.render("show.ejs", {item:foundItem});
		}
	})
});

app.get("/items/:id/edit", function(req,res){
	Item.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log(err)
		} else {
			res.render("edit.ejs", {item:foundItem})
		}
	})
})

app.put("/items/:id", function(req,res){
	Item.findByIdAndUpdate(req.params.id, req.body.item, function(err,updatedItem){
		if (err) {
			console.log(err);
		} else {
			res.redirect("/items/store/"+req.body.item.store);
		}
	})
})

app.delete("/items/:id", function(req,res){
	Item.findByIdAndRemove(req.params.id, function(err){
		if (err) {
			console.log(err);
			res.redirect("/items");
		} else {
			res.redirect("/items");
		}
	})
});