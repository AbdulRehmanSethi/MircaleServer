const mongoose = require('mongoose');

const promptToShortsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user
    prompt: { type: String, required: true }, // Original YouTube URL
    folderPath: { type: String, required: true }, // Path to the folder containing the shorts
    shortPath: { type: String, required: true }, // Array of public URLs for the shorts
    expiresAt: { type: Date, required: true } // Expiration time for the shorts
});

module.exports = mongoose.model('promptToShort', promptToShortsSchema);