require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingsROuter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL || process.env.MONGO_URL || process.env.MONGO_URI;

async function connectToDatabase() {
    if (!dbUrl) {
        throw new Error("MongoDB connection string is missing. Set ATLASDB_URL (or MONGO_URL/MONGO_URI) in your environment.");
    }

    try {
        await mongoose.connect(dbUrl);
        console.log("MongoDB connected successfully.");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
}

app.set("view engine" ,"ejs");
app.set("views", path.join(__dirname , "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static (path.join(__dirname , "public")));

const sessionOptions = {
    secret: process.env.SECRET || "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};


// app.get("/" , async (req, res) => {
//     res.send("Hi I'm server root" );
// });


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});


// app.get("/demouser", async (req, res) => {
//     let existingUser = await User.findOne({ username: "delta-student" });
//     if (existingUser) {
//         return res.send(existingUser);
//     }

//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student"
//     });

//     let registerUser = await User.register(fakeUser, "helloworld");
//     res.send(registerUser);
// });

app.use("/listings", listingsROuter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

//ERROR HANDLE
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "something went wrong!"} = err;
    res.status(statusCode).render("error.ejs", { message });
    //res.status(statusCode).send(message);
});

const port = process.env.PORT || 8080;

connectToDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("Application startup aborted because the database connection could not be established.");
        process.exitCode = 1;
    });
