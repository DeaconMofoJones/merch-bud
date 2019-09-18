var express 	= require("express"),
app				= express(),
mongoose		= require("mongoose"),
methodOverride 	= require("method-override"),
bodyParser 		= require("body-parser"),
port			= process.env.PORT || 3000,
mongoLocal		= "mongodb://localhost:27017/merchandiser",
mongoServer		= "mongodb+srv://deaconmofojones:Chuletas1@merchapp-a2iob.azure.mongodb.net/test?retryWrites=true&w=majority"

mongoose.connect(mongoLocal, { useNewUrlParser:true }, function(err){
	if (err) {
		console.log("connecting to online mongo server");
		mongoose.connect(mongoServer, {useNewUrlParser:true}, function(err){
			if (err) {
				console.log(err);
			}
			else{
				console.log("successfully connected to mongo database")
			}
		})
	}
});
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));


// ===============
// -----ITEMS-----		---------------------------------
// ===============

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
			res.redirect("/items/"+createdItem.store);
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
	Item.findByIdAndRemove(req.params.id, function(err, deletedItem){
		if (err) {
			console.log(err);
			
		} else {
			res.redirect("/items/store/"+deletedItem.store);
		}
	})
});



// ==================
// -----ROUTINES-----		---------------------------------
// ==================




var routineItemSchema = new mongoose.Schema({
	name: String,
	store: String,
	type: String,
	amount: Number,
	index: Number
});

var RoutineItem = mongoose.model("RoutineItem", routineItemSchema);


app.get("/store/routine/:storeName", function(req,res){
	RoutineItem.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			res.render("routine.ejs", {items:items,storeName:req.params.storeName})
		}
	});
});

app.get("/routine/new", function(req, res){
	res.render("formNewRoutineItem.ejs");
})

app.post("/routineItem", function(req, res){
	RoutineItem.create(req.body.routineItem, function(err, createdItem){
		if (err) {
			alert(err);
			res.render("formNewRoutineItem.ejs");
		} else {
			res.redirect("/store/routine/"+req.body.routineItem.store);
		}
	})
})

app.put("/routineItem/:id", function(req,res){
	RoutineItem.findByIdAndUpdate(req.params.id, req.body.item, function(err,updatedItem){
		if (err) {
			console.log(err);
		} else {
			res.redirect("/store/routine/"+req.body.routineItem.store);
		}
	})
})

app.get("/routineItem/:id/edit", function(req,res){
	RoutineItem.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log(err)
		} else {
			res.render("editRoutineItem.ejs", {item:foundItem})
		}
	})
})

app.delete("/routineItem/:id", function(req,res){
	RoutineItem.findByIdAndRemove(req.params.id, function(err,deletedItem){
		if (err) {
			console.log(err);
			
		} else {
			res.redirect("/store/routine/"+deletedItem.store);
		}
	})
});




if (process.env.NODE_ENV === 'production') {

}



app.listen(port, function(){
	console.log("Merchandiser App has started")
});