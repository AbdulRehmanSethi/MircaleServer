// // models/VideoData.js
// const mongoose = require('mongoose');

// const transcribeSummarySchema = new mongoose.Schema({
//     youtubeLink: { type: String, required: true, unique: true },
//     transcript: { type: String, required: true },
//     summary: { type: String, required: true },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     createdAt: { type: Date, default: Date.now, expires: 864000 }
// });

// module.exports = mongoose.model('transcribeSummary', transcribeSummarySchema);

// models/VideoData.js
const mongoose = require('mongoose');

const transcribeSummarySchema = new mongoose.Schema({
    videoId: { type: String, required: true }, 
    youtubeLink: { type: String, required: true },
    transcript: { type: String },
    summary: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now, expires: 864000 } 
});

module.exports = mongoose.model('transcribeSummary', transcribeSummarySchema);