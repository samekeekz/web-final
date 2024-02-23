const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        password: String,
        isAdmin: {
            type: Boolean,
            default: false,
        },
    },
    {
        collection: "users",
        timestamps: true,
    }
);


const playerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    country: String,
    team: {
        fullName: String,
        abbreviation: String
    },
    pictures: [String],
}, {
    collection: "basketballPlayers",
    timestamps: true,
});

const Player = mongoose.model('Player', playerSchema);

const User = mongoose.model("User", userSchema);

module.exports = { Player, User };
