const subscriptionFeatureModel = require('../models/subscriptionFeature');
const userUsageModel = require('../models/userUsage');
const subscriptionModel = require('../models/subscriptionModel');

async function checkAndUpdateUsage(userId, featureName) {
    try {
        // Get the user's subscription plan
        const subscription = await subscriptionModel.findOne({ userId });
        if (!subscription) {
            return { allowed: false, message: "User subscription not found" };
        }

        // Get the feature limit for the user's plan
        const feature = await subscriptionFeatureModel.findOne({
            planName: subscription.planName,
            featureName,
        });
        if (!feature) {
            return { allowed: false, message: "Feature not found for the user's plan" };
        }

        // Parse the limit (e.g., "5/day" or "10/month")
        const [limit, period] = feature.limit.split('/');

        // Get today's date or current month
        const today = new Date().toISOString().split('T')[0];
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        // Find the user's usage for the feature
        let usageQuery = {
            userId,
            featureName,
        };

        if (period === 'day') {
            usageQuery.date = today;
        } else if (period === 'month') {
            usageQuery.date = { $gte: currentMonthStart, $lte: currentMonthEnd };
        }

        const usage = await userUsageModel.findOne(usageQuery);

        // Check if the limit is exceeded
        if (usage && usage.usageCount >= parseInt(limit)) {
            return { allowed: false, message: `Daily/monthly limit exceeded for ${featureName}` };
        }

        // Increment usage count or create a new record
        if (usage) {
            usage.usageCount += 1;
            await usage.save();
        } else {
            await userUsageModel.create({
                userId,
                featureName,
                usageCount: 1,
                date: period === 'day' ? today : new Date(),
            });
        }

        return { allowed: true };
    } catch (error) {
        console.error(error);
        return { allowed: false, message: "Internal server error", details: error.message };
    }
}

module.exports = {
    checkAndUpdateUsage,
};