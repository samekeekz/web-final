const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require('express-session');
const path = require("path");
const cors = require("cors");
const { connectDB } = require("./config/db");
const app = express();
const User = require("./models/schema");
const { log } = require("console");

require("dotenv").config();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
app.use(session({ secret: 'cookie', resave: true, saveUninitialized: true }));

connectDB();


app.get("/", (req, res) => {
    res.redirect("/authorization.html");
});


app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ name: username });

        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: username,
            password: hashedPassword,
            isAdmin: false,
        });

        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ name: username });

        if (!user) {
            return res.status(401).json({ success: false, error: "Username not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, error: "Username or password does not match" });
        }

        req.session.username = username;
        req.session.isAdmin = user.isAdmin;

        if (user.isAdmin) {
            return res.status(200).json({
                success: true,
                username: user.name,
                redirectUrl: "/adminPage.html",
            });
        }

        res.status(200).json({
            success: true,
            username: user.name,
            redirectUrl: "/weatherPage?username=" + user.name
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

app.get("/photo", async (req, res) => {
    const { car } = req.query;
    const unsplashApiUrl = `https://api.unsplash.com/photos/random?query=${car}&client_id=CrXTXNPoE1q_As9WjN7gDm5-gXxMaQfRq5O4btwNM4c`;

    try {
        const unsplashResponse = await fetch(unsplashApiUrl);
        if (!unsplashResponse.ok) {
            throw new Error("Unsplash API error");
        }

        const unsplashData = await unsplashResponse.json();
        res.status(200).json(unsplashData.urls.raw);
    } catch (error) {
        console.error("Error fetching background image:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

async function fetchWikipediaData(cityName) {
    const wikipediaEndpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&redirects=true&titles=${cityName}&origin=*`;

    try {
        const wikipediaResponse = await fetch(wikipediaEndpoint);

        if (!wikipediaResponse.ok) {
            throw new Error('error');
        }

        const wikipediaData = await wikipediaResponse.json();

        const pages = wikipediaData.query.pages;
        const firstPageId = Object.keys(pages)[0];
        const extract = pages[firstPageId].extract;

        const plainText = extract.replace(/<[^>]+>/g, '').trim();

        return plainText;
    } catch (error) {
        console.error('error', error);
        throw error;
    }
}



// app.get("/admin/userlist", async (req, res) => {

// })

// app.post("/admin/add", async (req, res) => {

// });

// app.post("/admin/edit", async (req, res) => {

// });

// app.delete("/admin/delete", async (req, res) => {

// });



const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is up and running at http://localhost:${port}`);
});
