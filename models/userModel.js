// file: models/User.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        role: {
            type: String,
            required: true,
            enum: [
                "person",
                "admin",
                "agent",
            ],
        },
        googleUid: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
