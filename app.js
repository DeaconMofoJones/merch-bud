var express 	= require("express"),
app				= express(),
mongoose		= require("mongoose"),
passport		= require("passport"),
bcrypt 			= require("bcryptjs"),
jwt 			= require("jsonwebtoken"),
LocalStrategy 	= require("passport-local"),
passportLocalMongoose = require("passport-local-mongoose"),
methodOverride 	= require("method-override"),
bodyParser 		= require("body-parser"),
Item 			= require("./models/item.js"),
Token 			= require("./models/token.js"),
WarehouseItem   = require("./models/warehouseItem.js"),
User 			= require("./models/user.js"),
port			= process.env.PORT || 3000,
mongoLocal		= "mongodb://localhost:27017/merchandiser",
mongoServer		= "mongodb+srv://deaconmofojones:Chuletas1@merchapp-a2iob.azure.mongodb.net/test?retryWrites=true&w=majority"

require('dotenv').config();

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

//allows our app to accept JSON
app.use(express.json())

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





//new custom item
app.get("/items/new/:storeName", isLoggedIn, function(req,res){
	res.render("newItem.ejs", {storeName:req.params.storeName,user:req.user});
});

//new select item from warehouse
app.get("/items/newFromWarehouse/:storeName", isLoggedIn, function(req,res){
	WarehouseItem.find({}, function(err,allWarehouseItems){
		if (err) {
			res.send(err);
		} else {
			res.render("selectWarehouseItem.ejs", {user:req.user,warehouseItems:allWarehouseItems, storeName:req.params.storeName})
		}
	})
});

//create custom
app.post("/items", isLoggedIn, function(req,res){
	Item.create(req.body.item, function(err, createdItem){
		if (err) {
			res.render("newItem.ejs",{user:req.user});
		} else {

			User.findOne({username:req.user.username}, function(err, foundUser){
				if (err) {
					console.log(err)
				} else {

					foundUser.items.push(createdItem);
					console.log(foundUser.items);
					foundUser.save(function(err, data){
						if (err) {
							console.log(err)
						} else {
							res.redirect("/items/store/"+createdItem.store);
						}
					})
				}
			})

			
		}
	})
});

//create copy from warehouse item
app.post("/copyFromWarehouse/:id/:store", isLoggedIn, function(req,res){
	WarehouseItem.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log("error in finding warehouse item: "+err);
		} else {
			console.log(foundItem);
			var newItem = {
				name : foundItem.name,
				image : foundItem.image,
				type : foundItem.type,
				index : foundItem.index,
				listCount : foundItem.listCount,
				store : req.params.store,
				amount : foundItem.amount
			}
			Item.create(newItem, function(err,createdItem){
				if (err) {
					console.log("err");
				} else {
					console.log(createdItem);
					User.findOne({username:req.user.username}, function(err, foundUser){
						if (err) {
							console.log(err)
						} else {
							foundUser.items.push(createdItem);
							foundUser.save(function(err, data){
								if (err) {
									console.log(err)
								} else {
									res.redirect("/items/store/"+req.params.store);
								}
							})
						}
					})
				}
			})
		}
	});
	
});

//show
app.get("/items/:id", isLoggedIn, function(req,res){
	Item.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log(err);
			res.send("error in get /items/:id: "+ err);
		} else {
			res.render("show.ejs", {item:foundItem,user:req.user});
		}
	})
});

//edit
app.get("/items/:id/edit", isLoggedIn, function(req,res){
	Item.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log(err)
		} else {
			res.render("edit.ejs", {item:foundItem,user:req.user})
		}
	})
})

//edit order
app.get("/changeOrder/:storeName", isLoggedIn, function(req,res){
	User.findById(req.user._id).populate("items").exec(function(err,user){
		if (err) {
			console.log(err)
			res.send(err);
		} else {
			console.log(user)
			res.render("changeOrder.ejs", {user:user,storeName:req.params.storeName})
		}
	})
	
});

//edit backstock amount of all store items
app.get("/takeInventory/:storeName", isLoggedIn, function(req,res){
	User.findById(req.user._id).populate("items").exec(function(err,user){
		if (err) {
			console.log(err);
			res.send(err);
		} else {
			res.render("takeInventory.ejs", {user:user,storeName:req.params.storeName})
		}
	})
})

//update
app.put("/items/:id", isLoggedIn, function(req,res){
	Item.findByIdAndUpdate(req.params.id, req.body.item, function(err,updatedItem){
		if (err) {
			console.log(err);
		} else {
			res.redirect("/items/store/"+req.body.item.store);
		}
	})
})

//multi update
app.put("/multiUpdate/:length/:redirect/:storeName", isLoggedIn, function(req,res){
	var postItems = [];
	var storeName= req.params.storeName;
	var isRedirect = req.params.redirect;
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
	} else if(isRedirect=="false"){
		res.redirect("/changeOrder/"+storeName)
	} else if(isRedirect=="index"){
		res.redirect("/items/store/"+storeName)
	}
})



//delete
app.delete("/items/:id", isLoggedIn, function(req,res){
	//find item in database and remove it
	Item.findByIdAndRemove(req.params.id, function(err, deletedItem){
		if (err) {
			console.log(err);
			
		} else {
			//find user and remove the database item reference from user.items array
			User.findById(req.user._id, function(err, foundUser){
				if (err) {
					console.log(err)
				} else {
					var deletedItemIndex = foundUser.items.findIndex(x => x == req.params.id);
					foundUser.items.splice(deletedItemIndex,1);
					foundUser.save(function(err, data){
						if (err) {
							console.log(err)
						} else {
							console.log(data)
							res.redirect("/items/store/"+deletedItem.store);
						}
					})
				}
			})
			
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
			User.findById(req.user._id).populate("items").exec(function(err,user){
				if (err) {
					console.log(err)
					res.send(err);
				} else {
					console.log(user)
					res.render("startList.ejs", {user:user,storeName:req.params.storeName})
				}
			})
			
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
	User.findById(req.user._id).populate("items").exec(function(err,user){
		if (err) {
			console.log(err)
			res.send(err);
		} else {
			console.log(user)
			res.render("showList.ejs", {user:user,storeName:req.params.storeName})
		}
	})
});





//============================================
//				Warehouse Items
//============================================

//index
app.get("/warehouse/", isLoggedIn, isAdmin, function(req,res){
	WarehouseItem.find({}, function(err,allWarehouseItems){
		if (err) {
			res.send(err);
		} else {
			res.render("warehouse.ejs", {user:req.user,warehouseItems:allWarehouseItems})
		}
	})
});

//new
app.get("/warehouse/new", isLoggedIn, isAdmin, function(req,res){
	res.render("newWarehouseItem.ejs", {user:req.user});
});

//create
app.post("/warehouse", isLoggedIn, isAdmin, function(req,res){
	WarehouseItem.create(req.body.item, function(err, createdItem){
		if (err) {
			res.send(err);
		} else {
			res.redirect("/warehouse");
		}
	})
});

//show
app.get("/warehouse/:id", isLoggedIn, isAdmin, function(req,res){
	WarehouseItem.findById(req.params.id, function(err,foundItem){
		if (err) {
			console.log(err);
			res.send("error in get /items/:id: "+ err);
		} else {
			res.render("showWarehouseItem.ejs", {item:foundItem,user:req.user});
		}
	})
});

//edit
app.get("/warehouse/:id/edit", isLoggedIn, isAdmin, function(req,res){
	WarehouseItem.findById(req.params.id, function(err,foundItem){
		if (err) {
			res.send(err);
		} else {
			res.render("editWarehouseItem.ejs", {item:foundItem,user:req.user})
		}
	})
})

//update
app.put("/warehouse/:id", isLoggedIn, isAdmin, function(req,res){
	WarehouseItem.findByIdAndUpdate(req.params.id, req.body.item, function(err,updatedItem){
		if (err) {
			res.send(err);
		} else {
			res.redirect("/warehouse");
		}
	})
})

//delete
app.delete("/warehouse/:id", isLoggedIn, isAdmin, function(req,res){
	//find item in database and remove it
	WarehouseItem.findByIdAndRemove(req.params.id, function(err, deletedItem){
		if (err) {
			res.send(err);
		} else {
			res.redirect("/warehouse");
		}
	})
});


//============================================
//				Passport User Auth Routes
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
//==================
//	Check Admin
//==================
function isAdmin(req, res, next){
	if (req.user.username==="deaconjones") {
		return next();
	} else {
		console.log("User is not admin")
		res.send("You do not have admin privilege <a href='/'>home</a>");	
	}
	
}

//============================================
//				Bcrypt User Auth Routes
//============================================

//==================
//  token auth test 
//==================


//index
app.get("/getCups", authenticateToken, function(req,res){
	const cups = [
		{
			name: "cup 1"
		},
		{
			name: "cup 2"
		}
	]
	res.json({cups: cups,username: req.user.username})
})

//==================
//Login Routes
//==================

//login form
app.get("/blogin", function(req,res){
	res.render("blogin.ejs", {user:req.user})
})

//login handler
app.post("/blogin", function (req, res) {

	User.find({username:req.body.username}, async (err, foundUser) => {
		if (err) {
			res.send(err)
		}
		try {


			const candidatePassword = req.body.password
			const dbPassword = foundUser[0].password;
			await bcrypt.compare(candidatePassword, dbPassword, function(err,result){
				if (err) {
					res.send(err)
				} else if (result == true){
					//user authenticated
					const authdUser = { username: foundUser[0].username};
					console.log(authdUser);
					const accessToken = generateAccessToken(authdUser)
					const refreshToken = generateRefreshToken(authdUser)
					//save refresh token in db
					Token.create({refreshToken:refreshToken}, function(err,createdItem){
						if (err) {
							res.send(err)
						} else {
							res.json({accessToken: accessToken, refreshToken:refreshToken})
						}
					})
				} else {
					res.send("login failure...")
				}
			})
		} catch {
			res.status(500).send("catch")
		}
	})
})

//==================
//Register Routes
//==================

//register form
app.get("/bregister", function(req,res){
	res.render("bregister.ejs", {user:req.user})
})

//register handler
app.post("/bregister", function (req,res)  {
	try {
		User.find({username:req.body.username}, async (err, foundUser) => {
			if (err) {
				res.send(err)
			} else if (foundUser.length > 0){
				res.send("<h1>user already exists</h1>"+foundUser)
			} else {
				await bcrypt.hash(req.body.password,10,function(err,hashedPassword){
					User.create({username:req.body.username,password:hashedPassword}, function(err,createdUser){
						if (err) {
							res.send(err)
						} else {
							res.send("Successfully Create User: " + createdUser.username)
						}
					})
				})
			}
		})
		
	} catch {
		res.send("error")
	}
})


//==================================
//	Logout (deleting refresh tokens)
//==================================

//logout
app.delete("/blogout", function(req,res){
	Token.find({refreshToken:req.body.token}, (err, foundTokens) => {
		if (err) {
			res.send(err)
		} else {
			Token.findByIdAndRemove(foundTokens[0]._id, function(err,deletedTokens){
				if (err) {
					res.send(err)
				} else {
					res.sendStatus(204)
				}
			})
		}
	})
})

//==============================
//	test route
//==============================
app.get("/bgettesttokenpage", function(req,res){
	res.render("testtokenroute.ejs")
})
app.post("/btesttoken", function (req, res) {
	const accessToken = generateAccessToken({username: "pring"})
	const refreshToken = generateRefreshToken({username: "pring"})
	res.json({accessToken: accessToken, refreshToken:refreshToken})
})

//==============================
//	Tokens
//==============================

//generate access token
function generateAccessToken(user){
	return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '480m' })
}

//generate refresh token
function generateRefreshToken(user){
	return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
}

//create new access token 
app.post("/token", (req, res) => {
	const refreshToken = req.body.token;
	if (refreshToken == null) {
		return res.sendStatus(401)
	}
	Token.find({refreshToken:refreshToken}, function(err,foundRefreshToken){
		if (err) {
			return res.sendStatus(403)
		} else if (foundRefreshToken.length>0) {
			jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err,user) => {
				if (err) {
					return res.sendStatus(403)
				} else {
					const accessToken = generateAccessToken({username:user.username})
					res.json({accessToken:accessToken});
				}
			})
		} else {
			res.send("refresh token not found");
		}
	})
})

//authenticate token middleware
function authenticateToken(req,res,next){
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]
	if (token == null) { return res.sendStatus(401) }

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,user) => {
		if (err) {
			return res.sendStatus(403)
		} else {
			req.user = user
			next()
		}
	})
}


if (process.env.NODE_ENV === 'production') {

}



app.listen(port, function(){
	console.log("Merchandiser App has started")
});