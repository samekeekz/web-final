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
        apiData: [
            {
                firstName: {
                    type: String,
                    required: true
                },
                lastName: {
                    type: String,
                    required: true
                },
                team: String,
                position: String,
                country: String,
                height: String,
                weight: String,
            }
        ],
    },
    {
        collection: "users",
        timestamps: true,
    }
);


const playerSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        team: {
            fullName: String,
        },
        pictures: [String],
    },
    {
        collection: "basketballPlayers",
        timestamps: true,
    });

const Player = mongoose.model('Player', playerSchema);

const User = mongoose.model("User", userSchema);

module.exports = { Player, User };
