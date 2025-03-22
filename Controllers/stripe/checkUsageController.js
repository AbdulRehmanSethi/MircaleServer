const subscriptionFeatureModel = require('../../models/subscriptionFeature');
const userUsageModel = require('../../models/userUsage');
const subscriptionModel = require('../../models/subscriptionModel');

// Check usage and increment if allowed
exports.checkUsage = async (req, res) => {
    const { userId, featureName } = req.body;

    try {
        // Get the user's subscription plan
        const subscription = await subscriptionModel.findOne({ userId });
        if (!subscription) {
            return res.status(404).json({
                status: "Failed",
                message: "User subscription not found",
            });
        }

        // Get the feature limit for the user's plan
        const feature = await subscriptionFeatureModel.findOne({
            planName: subscription.planName,
            featureName,
        });
        if (!feature) {
            return res.status(404).json({
                status: "Failed",
                message: "Feature not found for the user's plan",
            });
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
            return res.status(403).json({
                status: "Failed",
                message: `Daily/monthly limit exceeded for ${featureName}`,
            });
        }

        // Increment usage count or create a new record
        let updatedUsageCount;
        if (usage) {
            usage.usageCount += 1;
            await usage.save();
            updatedUsageCount = usage.usageCount;
        } else {
            await userUsageModel.create({
                userId,
                featureName,
                usageCount: 1,
                date: period === 'day' ? today : new Date(),
            });
            updatedUsageCount = 1;
        }

        res.status(200).json({
            status: "Success",
            message: "Usage checked and incremented",
            usageCount: updatedUsageCount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "Failed",
            message: "Internal server error",
            error: error.message,
        });
    }
};