const mongoose = require('mongoose');

const subscriptionFeatureSchema = new mongoose.Schema({
    planName: {
        type: String,
        enum: ['FREE', 'PLUS', 'PRO', 'VIP'],
        required: true,
    },
    featureName: {
        type: String,
        required: true,
    },
    limit: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('SubscriptionFeature', subscriptionFeatureSchema);