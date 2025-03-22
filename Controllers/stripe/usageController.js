const userUsageModel = require('../../models/userUsage');

// Increment usage for a feature
exports.incrementUsage = async (req, res) => {
    const { userId, featureName } = req.body;

    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Find or create a usage record for the user, feature, and date
        const usage = await userUsageModel.findOneAndUpdate(
            { userId, featureName, date: today },
            { $inc: { usageCount: 1 } },
            { upsert: true, new: true }
        );

        res.status(200).json({
            status: "Success",
            message: "Usage incremented successfully",
            usage,
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

// Get usage for a user and feature
exports.getUsage = async (req, res) => {
    const { userId, featureName } = req.body;

    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Find the usage record for the user, feature, and date
        const usage = await userUsageModel.findOne({
            userId,
            featureName,
            date: today,
        });

        if (!usage) {
            return res.status(404).json({
                status: "Failed",
                message: "No usage record found",
            });
        }

        res.status(200).json({
            status: "Success",
            message: "Usage retrieved successfully",
            usage,
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