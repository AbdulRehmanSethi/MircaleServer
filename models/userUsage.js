const mongoose = require('mongoose');

const userUsageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    featureName: {
        type: String,
        required: true,
    },
    usageCount: {
        type: Number,
        default: 0,
    },
    date: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('UserUsage', userUsageSchema);