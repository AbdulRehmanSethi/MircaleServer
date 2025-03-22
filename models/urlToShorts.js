// models/Shorts.js
const mongoose = require('mongoose');

const urlToShortsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user
    url: { type: String, required: true }, // Original YouTube URL
    folderPath: { type: String, required: true }, // Path to the folder containing the shorts
    shortsPaths: [{ type: String, required: true }], // Array of public URLs for the shorts
    expiresAt: { type: Date, required: true } // Expiration time for the shorts
});

module.exports = mongoose.model('urlToShort', urlToShortsSchema);