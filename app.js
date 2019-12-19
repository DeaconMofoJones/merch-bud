var express 	= require("express"),
app				= express(),
mongoose		= require("mongoose"),
passport		= require("passport"),
LocalStrategy	=require("passport-local"),
methodOverride 	= require("method-override"),
bodyParser 		= require("body-parser"),
Item 			= require("./models/item.js"),
User 			= require("./models/user.js"),
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
	} else	{
		console.log("successfully connected to local mongo database")
	}
});
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));


// ===============
// -----ITEMS-----		---------------------------------
// ===============


//index(foodco by default)
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

//index
app.get("/items/store/:storeName", function(req,res){
	Item.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			res.render("index.ejs", {items:items,storeName:req.params.storeName})
		}
	});
	
});





//new
app.get("/items/new/:storeName", function(req,res){
	res.render("newItem.ejs", {storeName:req.params.storeName});
});

//create
app.post("/items", function(req,res){
	console.log(req.body)
	Item.create(req.body.item, function(err, createdItem){
		if (err) {
			res.render("newItem.ejs");
		} else {

			User.findOne({username:req.user.username}, function(err, foundUser){
				if (err) {
					console.log(err)
				} else {
					foundUser.items.push(createdItem);
					foundUser.save(function(err, data){
						if (err) {
							console.log(err)
						} else {
							console.log(data)
							res.redirect("/items/store/"+createdItem.store);
						}
					})
				}
			})

			
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

app.put("/multiUpdate/:length/:noRedirect/:storeName", function(req,res){
	var postItems = [];
	var storeName= req.params.storeName;
	var isRedirect = req.params.noRedirect;
	for (var i = 0; i < req.params.length; i++) {
		postItems.push(req.body[i])
	}
	for (var i = 0; i < postItems.length; i++) {
		Item.findByIdAndUpdate(postItems[i].UID, postItems[i], function(err, updatedItem){
			if (err) {
				console.log("ERROR: "+err)
			} else	{
				console.log("successfully updated item of name: "+updatedItem.name)
			}
		})
	}
	if (isRedirect=="true") {
		res.redirect("/viewList/"+storeName)
	} else {
		res.redirect("/changeOrder/"+storeName)
	}
})

app.get("/changeOrder/:storeName", function(req,res){
	Item.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			res.render("changeOrder.ejs", {items:items,storeName:req.params.storeName})
		}
	});
	
});


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


app.get("/store/startList/:storeName", function(req,res){
	Item.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			res.render("startList.ejs", {items:items,storeName:req.params.storeName})
		}
	});
});

// app.get("/routine/new/:storeName", function(req, res){
// 	res.render("formNewRoutineItem.ejs", {storeName:req.params.storeName});
// })

// app.post("/routineItem", function(req, res){
// 	RoutineItem.create(req.body.routineItem, function(err, createdItem){
// 		if (err) {
// 			alert(err);
// 			res.render("formNewRoutineItem.ejs");
// 		} else {
// 			res.redirect("/store/routine/"+req.body.routineItem.store);
// 		}
// 	})
// })

// app.put("/routineItem/:id", function(req,res){
// 	RoutineItem.findByIdAndUpdate(req.params.id, req.body.routineItem, function(err,updatedItem){
// 		if (err) {
// 			console.log(err);
// 		} else {
// 			res.redirect("/store/routine/"+req.body.routineItem.store);
// 		}
// 	})
// })

// app.put("/routineItemNoRedirect/:id", function(req,res){
// 	RoutineItem.findByIdAndUpdate(req.params.id, req.body.routineItem, function(err,updatedItem){
// 		if (err) {
// 			console.log(err);
// 		} else {
			
// 		}
// 	})
// })

// app.get("/routineItem/:id/edit", function(req,res){
// 	RoutineItem.findById(req.params.id, function(err,foundItem){
// 		if (err) {
// 			console.log(err)
// 		} else {
// 			res.render("editRoutineItem.ejs", {item:foundItem})
// 		}
// 	})
// })

// app.delete("/routineItem/:id", function(req,res){
// 	RoutineItem.findByIdAndRemove(req.params.id, function(err,deletedItem){
// 		if (err) {
// 			console.log(err);
			
// 		} else {
// 			res.redirect("/store/routine/"+deletedItem.store);
// 		}
// 	})
// });

app.get("/viewList/:storeName", function(req,res){
	Item.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			res.render("showList.ejs", {items:items,storeName:req.params.storeName})
		}
	});
});


//==================
//	Check Logged In
//==================
function isLoggedIn(req, res, next){
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.redirect("/login");	
	}
	
}


if (process.env.NODE_ENV === 'production') {

}



app.listen(port, function(){
	console.log("Merchandiser App has started")
});