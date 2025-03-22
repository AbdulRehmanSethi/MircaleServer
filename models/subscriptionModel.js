const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    planName: {
        type: String,
        enum: ['FREE', 'PLUS', 'PRO', 'VIP'],
        default: 'FREE', // Default to FREE plan
        required: true,
    },
    stripeSubscriptionId: {
        type: String,
        unique: true,
        sparse: true, // Allows null values while enforcing uniqueness for non-null values
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'incomplete'],
        default: 'active',
    },
    startDate: {
        type: Date,
        default: Date.now, // Default to current date
    },
    endDate: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);