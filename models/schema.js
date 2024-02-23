const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
    {
        name: String,
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

module.exports = mongoose.model("User", userSchema);