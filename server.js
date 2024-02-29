const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const { connectDB } = require("./config/db");
const app = express();
const { Player, User } = require("./models/schema");
const i18n = require('i18n');
const axios = require('axios');

i18n.configure({
    locales: ['en', 'ru'], // Supported languages
    defaultLocale: 'en', // Default language
    directory: path.join(__dirname, 'locales'), // Directory containing localization files
    objectNotation: true, // Use object notation for translation keys
    register: global, // Register i18n functions globally
    queryParameter: 'lang',
});


require("dotenv").config();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
app.use(session({ secret: "cookie", resave: true, saveUninitialized: true }));
app.use(i18n.init);

connectDB();

app.use((req, res, next) => {
    // Set default language to "en" if not already set
    if (!req.session.lang) {
        req.session.lang = "en";
    }

    // Get language from query parameter if present
    const lang = req.query.lang;

    // Update language in session if query parameter is provided
    if (lang && ["en", "ru", "kz"].includes(lang)) { // Add more languages as needed
        req.session.lang = lang;
    }

    next();
});

app.get("/", (req, res) => {
    req.session.username = null;
    req.session.isAdmin = false;
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
            return res
                .status(401)
                .json({ success: false, error: "Username not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res
                .status(401)
                .json({ success: false, error: "Username or password does not match" });
        }

        req.session.username = username;
        req.session.isAdmin = user.isAdmin;

        if (user.isAdmin) {
            return res.status(200).json({
                success: true,
                username: user.name,
                redirectUrl: "/adminPage?lang=en",
            });
        }

        res.status(200).json({
            success: true,
            username: user.name,
            redirectUrl: "/main?lang=en",
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

async function fetchWikipediaData(playerName) {
    const wikipediaEndpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&redirects=true&titles=${playerName}&origin=*`;

    try {
        const wikipediaResponse = await fetch(wikipediaEndpoint);

        if (!wikipediaResponse.ok) {
            throw new Error("error");
        }

        const wikipediaData = await wikipediaResponse.json();

        const pages = wikipediaData.query.pages;
        const firstPageId = Object.keys(pages)[0];
        const extract = pages[firstPageId].extract;

        const plainText = extract.replace(/<[^>]+>/g, "").trim();

        return plainText;
    } catch (error) {
        console.error("error", error);
        throw error;
    }
}

app.get("/main", async (req, res) => {
    const { isAdmin } = req.session;
    res.render("main", { isAdmin, playerData: null });
});


app.get("/players", async (req, res) => {
    const { isAdmin } = req.session;
    try {
        const players = await Player.find().exec();
        res.render("players", { players, isAdmin }); // Render admin.ejs and pass players data
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

})

app.post('/getPlayerInfo', async (req, res) => {
    const { isAdmin, username } = req.session;
    try {
        const { fullName } = req.body;
        const [firstName, lastName] = fullName.split(' ');

        // Fetch player data using the first name
        const response = await axios.get(`https://api.balldontlie.io/v1/players?search=${firstName}&per_page=100`, {
            headers: {
                'Authorization': 'e7aaab04-ac11-4263-b188-ec3371e9b578'
            }
        });

        const players = response.data;
        // Search for the player whose first name and last name match the requested player
        const matchingPlayer = players.data.find(player => {
            return player.first_name.toLowerCase() === firstName.toLowerCase() &&
                player.last_name.toLowerCase() === lastName.toLowerCase();
        });

        if (!matchingPlayer) {
            return res.render('main?lang=en', { playerData: null, isAdmin });
        }

        try {
            const { first_name, last_name, position, height, weight, country, team } = matchingPlayer;

            const userData = {
                firstName: first_name,
                lastName: last_name,
                position,
                height,
                weight,
                country,
                team: team.full_name
            };

            const user = await User.findOne({ name: username });

            if (user) {
                user.apiData.push(userData);
                await user.save();
                console.log('Player data saved successfully.');
            } else {
                console.log('User not found.');
            }
        } catch (error) {
            console.error('Error saving player data:', error.message);
        }


        // Return the matching player data or null if no match is found
        res.render('main', { playerData: matchingPlayer || null, isAdmin });
    } catch (error) {
        console.error('Error fetching player data:', error.message);
        res.render('error');
    }
});

app.get("/history", async (req, res) => {
    const { username, isAdmin } = req.session;
    try {
        const user = await User.findOne({ name: username });
        const userData = user;
        res.render("history", { userData, isAdmin });
    } catch (error) {
        console.error("Error fetching player data:", error.message);
        res.render('error');
    }
});

app.post('/teamStats', async (req, res) => {
    const { team } = req.body;
    console.log(team);
    try {
        // First API request to get the team ID
        const teamResponse = await axios.get(`https://v2.nba.api-sports.io/teams?name=${team}`, {
            headers: {
                'x-rapidapi-host': 'v2.nba.api-sports.io',
                'x-rapidapi-key': 'aeffaf15370f438b3db5e3dfecb36c3e'
            }
        });

        // Extracting the team ID from the response
        const teamId = teamResponse.data.response[0].id;
        console.log(teamId);
        // Second API request to get team statistics using the obtained team ID
        const statisticsResponse = await axios.get(`https://v2.nba.api-sports.io/teams/statistics?season=2023&id=${teamId}`, {
            headers: {
                'x-rapidapi-host': 'v2.nba.api-sports.io',
                'x-rapidapi-key': 'aeffaf15370f438b3db5e3dfecb36c3e'
            }
        });

        // Sending the team statistics data in the response
        const teamStatistics = statisticsResponse.data.response[0];
        console.log(teamStatistics);
        res.json({ teamStatistics });
    } catch (error) {
        // Handling errors
        res.status(500).json({ error: 'Failed to fetch team statistics' });
    }
});


// * Admin Page
app.get("/adminPage", async (req, res) => {
    const { isAdmin } = req.session;
    try {
        const players = await Player.find().exec();
        res.render("adminPage", { players, isAdmin }); // Render admin.ejs and pass players data
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/admin/players", async (req, res) => {
    const { isAdmin } = req.session;
    try {
        const players = await Player.find().exec();
        res.render("adminPage", { players, isAdmin }); // Render admin.ejs and pass players data
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// * Need to implement the carousel for the images

app.post("/admin/add", async (req, res) => {

    try {
        const { firstName, lastName, team, picture1 } = req.body;
        await Player.create({
            firstName,
            lastName,
            team: { fullName: team },
            pictures: [picture1],
        });
        res.redirect("/admin/players");
    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/admin/update', async (req, res) => {
    const { isAdmin } = req.session;
    try {
        const { previousFirstName, previousLastName, firstName, lastName, team, picture1 } = req.body;
        console.log(previousFirstName, previousLastName, firstName, lastName, team, picture1);
        const player = await Player.findOne({
            firstName: previousFirstName,
            lastName: previousLastName
        });
        console.log(player);
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Update player data
        player.firstName = firstName;
        player.lastName = lastName;
        player.team.fullName = team;
        player.pictures = [picture1];

        // Save the updated player data
        await player.save();
        const players = await Player.find().exec();
        // Send a success response
        res.render("adminPage", { players, isAdmin }); // Render admin.ejs and pass players data
    } catch (error) {
        // If there's an error, return an error response
        console.error('Error updating player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete("/admin/delete", async (req, res) => {
    const { isAdmin } = req.session;
    const { firstName, lastName } = req.body;
    console.log(firstName, lastName);
    try {
        const player = await Player.findOne({
            firstName,
            lastName,
        });

        if (!player) {
            return res.status(404).json({ error: "Player not found" });
        }

        await Player.deleteOne({ firstName, lastName });

        const players = await Player.find().exec();
        res.render("adminPage", { players, isAdmin }); // Render admin.ejs and pass players data
    } catch (error) {
        console.error("Error deleting player:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is up and running at http://localhost:${port}`);
});
