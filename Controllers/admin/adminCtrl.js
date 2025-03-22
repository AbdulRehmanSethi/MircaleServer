
const personModel = require("../../models/personModel");
const subscriptionFeature = require("../../models/subscriptionFeature");
const subscriptionModel = require("../../models/subscriptionModel");
const userModel = require("../../models/userModel");
const userUsage = require("../../models/userUsage");

const { sendEmail } = require("../../utils/otp"); // Adjust the path to your otp.js file
// Get all users without password
exports.getAllUsers = async (req, res) => {
    try {
        // Fetch all users excluding the password field
        const users = await userModel.find({}, { password: 0 });

        // Fetch associated person details for each user
        const usersWithPersonDetails = await Promise.all(users.map(async (user) => {
            const person = await personModel.findOne({ user_id: user._id });
            return {
                ...user._doc,
                personDetails: person || null
            };
        }));

        res.status(200).json(usersWithPersonDetails);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch user details (excluding password)
        const user = await userModel.findById(userId, { password: 0 });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch user's subscription
        const subscription = await subscriptionModel.findOne({ userId });

        // Fetch user's usage
        const usage = await userUsage.find({ userId });

        // Fetch subscription features based on the user's plan
        let subscriptionFeatures = [];
        if (subscription) {
            subscriptionFeatures = await subscriptionFeature.find({ planName: subscription.planName });
        }

        // Combine all details into a single response
        const userDetails = {
            user,
            subscription: subscription || null,
            usage,
            subscriptionFeatures,
        };

        res.status(200).json(userDetails);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user details', error: error.message });
    }
};

exports.updateUserFeatureUsage = async (req, res) => {
    try {
        const { userId, featureName, action } = req.body;

        // Validate input
        if (!userId || !featureName || !action) {
            return res.status(400).json({ message: 'userId, featureName, and action are required' });
        }

        // Find the user's usage record for the specified feature
        let Usage = await userUsage.findOne({ userId, featureName });

        if (!Usage) {
            // If no record exists, create a new one
            Usage = new userUsage({
                userId,
                featureName,
                usageCount: 0,
                date: new Date(),
            });
        }

        // Update the usage count based on the action
        if (action === '+') {
            Usage.usageCount += 1;
        } else if (action === '-') {
            Usage.usageCount -= 1;
        } else {
            return res.status(400).json({ message: 'Invalid action. Use "increment" or "decrement".' });
        }

        // Ensure usage count doesn't go below 0
        if (Usage.usageCount < 0) {
            Usage.usageCount = 0;
        }

        // Save the updated usage record
        await Usage.save();

        res.status(200).json({ message: 'User feature usage updated successfully', userUsage });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user feature usage', error: error.message });
    }
};

exports.updatePlan = async (req, res) => {
    const { userId, planName } = req.body;

    if (!userId || !planName) {
        return res.status(400).json({ message: 'userId and planName are required' });
    }

    try {
        // Find the subscription by userId and update the planName
        const updatedSubscription = await subscriptionModel.findOneAndUpdate(
            { userId: userId },
            { planName: planName },
            { new: true } // Return the updated document
        );

        if (!updatedSubscription) {
            return res.status(404).json({ message: 'Subscription not found for the given user' });
        }

        // Delete all UserUsage records associated with the user
        await userUsage.deleteMany({ userId: userId });

        res.status(200).json({ 
            message: 'Plan updated successfully and user usage records deleted', 
            subscription: updatedSubscription 
        });
    } catch (error) {
        console.error('Error updating plan or deleting user usage:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getAllFeatures = async (req, res) => {
    try {
        const features = await subscriptionFeature.find({});
        const groupedFeatures = features.reduce((acc, feature) => {
            if (!acc[feature.planName]) {
                acc[feature.planName] = [];
            }
            acc[feature.planName].push(feature);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: groupedFeatures
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching features',
            error: error.message
        });
    }
};

exports.updateFeatureLimit = async (req, res) => {
    try {
        const { id } = req.body;
        const { limit } = req.body;

        const updatedFeature = await subscriptionFeature.findByIdAndUpdate(
            id,
            { limit },
            { new: true }
        );

        if (!updatedFeature) {
            return res.status(404).json({
                success: false,
                message: 'Feature not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedFeature
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating feature limit',
            error: error.message
        });
    }
};



exports.sendemailToAllUsers = async (req, res) => {
    const { subject, text } = req.body;

    if (!subject || !text) {
        return res.status(400).json({ message: "Subject and text are required" });
    }

    try {
        // Fetch all users' emails
        const users = await userModel.find({}, { email: 1, _id: 0 });

        if (!users.length) {
            return res.status(404).json({ message: "No users found" });
        }

        // Extract emails from the users array
        const emails = users.map(user => user.email);

        // Send email to each user
        const emailPromises = emails.map(email => sendEmail(email, subject, text));

        // Wait for all emails to be sent
        const results = await Promise.all(emailPromises);

        // Check if all emails were sent successfully
        if (results.every(result => result === true)) {
            return res.status(200).json({ message: "Emails sent successfully" });
        } else {
            return res.status(500).json({ message: "Some emails failed to send" });
        }
    } catch (error) {
        console.error("Error sending emails:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getUsersJoinedToday = async (req, res) => {
    try {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to the start of the day

        // Find users who joined today
        const users = await userModel.find({
            createdAt: { $gte: today },
        });

        if (!users.length) {
            return res.status(404).json({ message: "No users joined today" });
        }

        // Fetch person details for each user
        const usersWithPersonDetails = await Promise.all(
            users.map(async (user) => {
                const person = await personModel.findOne({ user_id: user._id });
                return {
                    user: {
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt,
                    },
                    person: person ? { name: person.name, phno: person.phno } : null,
                };
            })
        );

        return res.status(200).json({ users: usersWithPersonDetails });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getSubscriptionsUpdatedToday = async (req, res) => {
    try {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to the start of the day

        // Find subscriptions updated today
        const subscriptions = await subscriptionModel.find({
            updatedAt: { $gte: today },
        }).populate({
            path: "userId",
            select: "email role createdAt", // Select specific fields from User
        });

        if (!subscriptions.length) {
            return res.status(404).json({ message: "No subscriptions updated today" });
        }

        // Fetch person details for each user associated with the subscription
        const subscriptionsWithDetails = await Promise.all(
            subscriptions.map(async (subscription) => {
                const person = await personModel.findOne({ user_id: subscription.userId._id });
                return {
                    subscription: {
                        planName: subscription.planName,
                        status: subscription.status,
                        startDate: subscription.startDate,
                        endDate: subscription.endDate,
                        updatedAt: subscription.updatedAt,
                    },
                    user: {
                        email: subscription.userId.email,
                        role: subscription.userId.role,
                        createdAt: subscription.userId.createdAt,
                    },
                    person: person ? { name: person.name, phno: person.phno } : null,
                };
            })
        );

        return res.status(200).json({ subscriptions: subscriptionsWithDetails });
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};