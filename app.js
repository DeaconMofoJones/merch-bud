var express 	= require("express"),
app				= express(),
mongoose		= require("mongoose"),
passport		= require("passport"),
LocalStrategy 	= require("passport-local"),
passportLocalMongoose = require("passport-local-mongoose"),
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

//tells express to read ejs files by default.
//This makes it to where you can leave of the '.ejs' at the end of the file
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));

app.use(require("express-session")({
	secret:"pancakes and doodlebops",
	resave: false,
	saveUninitialized: false
}))

//tells express to use passport
//we need these two lines anytime we use passport
app.use(passport.initialize());
app.use(passport.session());



passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ===============
// -----ITEMS-----		---------------------------------
// ===============


//index(foodco by default)
app.get("/", isLoggedIn, function(req,res){
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
app.get("/items/store/:storeName", isLoggedIn, function(req,res){
	Item.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			User.findById(req.user._id).populate("items").exec(function(err,user){
				if (err) {
					console.log(err)
					res.send(err);
				} else {
					console.log(user)
					res.render("index.ejs", {user:user,storeName:req.params.storeName})
				}
			})
			
		}
	});
	
});





//new
app.get("/items/new/:storeName", isLoggedIn, function(req,res){
	res.render("newItem.ejs", {storeName:req.params.storeName});
});

//create
app.post("/items", isLoggedIn, function(req,res){
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

app.get("/items/:id", isLoggedIn, function(req,res){
	Item.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log(err);
			res.send("error in get /items/:id: "+ err);
		} else {
			res.render("show.ejs", {item:foundItem});
		}
	})
});

app.get("/items/:id/edit", isLoggedIn, function(req,res){
	Item.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log(err)
		} else {
			res.render("edit.ejs", {item:foundItem})
		}
	})
})

app.put("/items/:id", isLoggedIn, function(req,res){
	Item.findByIdAndUpdate(req.params.id, req.body.item, function(err,updatedItem){
		if (err) {
			console.log(err);
		} else {
			res.redirect("/items/store/"+req.body.item.store);
		}
	})
})

app.put("/multiUpdate/:length/:noRedirect/:storeName", isLoggedIn, function(req,res){
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

app.get("/changeOrder/:storeName", isLoggedIn, function(req,res){
	Item.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			res.render("changeOrder.ejs", {items:items,storeName:req.params.storeName})
		}
	});
	
});


app.delete("/items/:id", isLoggedIn, function(req,res){
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


app.get("/store/startList/:storeName", isLoggedIn, function(req,res){
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

app.get("/viewList/:storeName", isLoggedIn, function(req,res){
	Item.find({store:req.params.storeName}, function(err,items){
		if (err) {
			console.log("error in get /items: "+err);
		} else {
			res.render("showList.ejs", {items:items,storeName:req.params.storeName})
		}
	});
});


//============================================
//				User Auth Routes
//============================================

//==================
//Register Routes
//==================

//register form
app.get("/register", function(req,res){
	res.render("register", {user:req.user});
})

//handle user sign up
app.post("/register", function(req,res){
	//.register hashes the password, then the callback function returns the new user with the hashed password
	//VERY IMPORTANT:
	//Never save password using new User({}).
	//Notice how the password is passed into the .register method as a second argument. This is the safe way to do it. It automatically hashes and salts the password, making it exponentially more secure then just saving the raw password to the User object in the database.
	User.register(new User({username:req.body.username}), req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.send(err);
		}
		//if the user is created, then log the saved user in to a session
		passport.authenticate("local")(req, res, function(){
			res.redirect("/");
		})
	})
})

//==================
//Login Routes
//==================

//show login form
app.get("/login", function(req,res){
	res.render("login", {user:req.user});
})

//handle login
app.post("/login", passport.authenticate("local",
	{
		successRedirect: "/",
		failureRedirect: "/login",
	}) , function(req,res){

})

//==================
//	Logout
//==================

app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/login");
})



//==================
//	Check Logged In
//==================
function isLoggedIn(req, res, next){
	if (req.isAuthenticated()) {
		return next();
	} else {
		console.log("user not authenticated")
		res.redirect("/login");	
	}
	
}


if (process.env.NODE_ENV === 'production') {

}



app.listen(port, function(){
	console.log("Merchandiser App has started")
});