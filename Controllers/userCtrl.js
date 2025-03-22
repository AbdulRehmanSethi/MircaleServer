
const personModel = require("../models/personModel");
const { sendOtpEmail, generateRandomOTP } = require("../utils/otp");
const subscriptionModel = require('../models/subscriptionModel');
const { storeOtpInDB } = require("./otpCtrl");
const asynchandler = require("express-async-handler");
const adminModel = require("../models/adminModel");
const userModel = require("../models/userModel");
const otpModel = require("../models/otpModel");




exports.registerCtrl = asynchandler(async (req, res) => {
    const { email, password, role, name, phno } = req.body;

    // Validate required fields
    if (!email || !password || !role || !name || !phno) {
        return res.status(400).json({
            status: "Failed",
            message: "All required fields must be provided",
        });
    }

    // Ensure the role is either 'person' or 'admin'
    if (role !== "person" && role !== "admin") {
        return res.status(400).json({
            status: "Failed",
            message: "Invalid role specified. Role must be either 'person' or 'admin'.",
        });
    }

    // Check if the email is already registered
    const userFound = await userModel.findOne({ email });
    if (userFound) {
        return res.status(400).json({
            status: "Failed",
            message: "Email already exists",
        });
    }

    // Create a new user
    const createdUser = await userModel.create({
        email,
        password,
        role,
    });

    try {
        let createdEntity;

        if (role === "person") {
            // Save additional details in personModel
            const personDetails = {
                name,
                phno,
                user_id: createdUser._id,
            };
            createdEntity = new personModel(personDetails);

            // Create a FREE plan subscription ONLY for 'person' role
            await subscriptionModel.create({
                userId: createdUser._id,
                planName: 'FREE', // Default to FREE plan
                status: 'active', // Default status
                startDate: new Date(), // Current date
            });
        } else if (role === "admin") {
            // Save additional details in adminModel
            const adminDetails = {
                name,
                phno,
                user_id: createdUser._id,
            };
            createdEntity = new adminModel(adminDetails);

            // Admins do NOT get a subscription
        }

        // Save the corresponding model
        await createdEntity.save();

        return res.status(200).json({
            status: "Success",
            message: "Account registered successfully",
            user: createdUser,
            details: createdEntity,
        });
    } catch (error) {
        console.log(error);
        await userModel.findByIdAndDelete(createdUser._id); // Rollback user creation
        return res.status(500).json({
            status: "Failed",
            message: "Internal server error",
            error: error.message,
        });
    }
});


exports.sendOtpCtrl = asynchandler(async (req, res) => {
    const { email } = req.params;

    // Check if email exists in the UserModel
    const userExists = await userModel.findOne({ email });
    if (userExists) {
        return res.status(400).json({
            status: "Failed",
            message: "Email already exists",
        });
    }

    // Delete any existing OTPs for the email
    await otpModel.deleteMany({ email });
    console.log(email);

    // Generate OTP and send via email
    const otp = generateRandomOTP();
    console.log("OTP : ", otp);

    const resp = await sendOtpEmail(email, otp);
    if (resp) {
        // Store OTP in the database
        await storeOtpInDB(email, otp);
        return res.status(200).json({
            status: "Success",
            message: "OTP sent successfully",
            otp: otp,
        });
    } else {
        return res.status(400).json({
            status: "Failed",
            message: "OTP not sent",
        });
    }
});


exports.googleSignupCtrl = asynchandler(async (req, res) => {
    const { name, email, googleUid } = req.body;
    try {
        let user = await userModel.findOne({ email });
        if (user) {
            if (!user.googleUid) {
                user.googleUid = googleUid;
                await user.save();
                console.log("1");
                return res.json({
                    status: "Success",
                    message: "Google UID added to existing account",
                    userID: user._id,
                    role: user.role
                });
            } else {
                console.log("2");
                return res.json({
                    status: "Success",
                    message: "User already Exists. ",
                    userID: user._id,
                    role: user.role
                });
            }
        }
        const newUser = await userModel.create({
            email,
            googleUid,
            role: "user",
        });

        try {
            const personDetails = {
                name: name,
                phno: "",
                user_id: newUser._id,
            };

            createdPerson = new personModel({
                ...personDetails,
            });

            await createdPerson.save();

            return res.json({
                status: "Success",
                message: "Google Sign-Up Successful",
                userID: newUser._id,
                role: newUser.role
            });
        } catch (error) {
            console.log(error);
            await userModel.findByIdAndDelete(newUser._id);
            return res.json({

                status: "Failed",
                message: "Internal server error",
                error: error.message,
            });
        }
    } catch (error) {
        console.error("Error during Google Sign-Up:", error);
        return res.status(500).json({
            status: "Failed",
            message: "Internal server error",
            error: error.message,
        });
    }
});


exports.loginCtrl = asynchandler(async (req, res) => {
    const { email, password } = req.body;

    const userFound = await userModel.findOne({ email });

    if (!userFound) {
        return res.json({
            status: "Failed",
            message: "Email not found",
        });
    }

    if (userFound.password === password) {


        return res.json({
            status: "Success",
            message: "Login Successfully",
            userID: userFound._id,
            role: userFound.role,
        });
    } else {
        return res.json({
            status: "Failed",
            message: "Password not Matched",
        });
    }
});

exports.getUserProfile = asynchandler(async (req, res) => {
    const { userId } = req.params;

    try {
        // Find the user in the userModel
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "Failed",
                message: "User not found",
            });
        }

        // Find the corresponding profile details based on the user's role
        let profileDetails;
        if (user.role === "person") {
            profileDetails = await personModel.findOne({ user_id: user._id });
        } else if (user.role === "admin") {
            profileDetails = await adminModel.findOne({ user_id: user._id });
        }

        if (!profileDetails) {
            return res.status(404).json({
                status: "Failed",
                message: "Profile details not found",
            });
        }

        return res.status(200).json({
            status: "Success",
            message: "Profile retrieved successfully",
            user: {
                email: user.email,
                role: user.role,
            },
            profile: profileDetails,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "Failed",
            message: "Internal server error",
            error: error.message,
        });
    }
});

exports.updateProfile = asynchandler(async (req, res) => {
    const { name, phno, userId } = req.body;

    try {
  
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "Failed",
                message: "User not found",
            });
        }

        // Update the corresponding profile details based on the user's role
        let updatedProfile;
        if (user.role === "person") {
            updatedProfile = await personModel.findOneAndUpdate(
                { user_id: user._id },
                { name, phno },
                { new: true }
            );
        } else if (user.role === "admin") {
            updatedProfile = await adminModel.findOneAndUpdate(
                { user_id: user._id },
                { name, phno },
                { new: true }
            );
        }

        if (!updatedProfile) {
            return res.status(404).json({
                status: "Failed",
                message: "Profile details not found",
            });
        }

        return res.status(200).json({
            status: "Success",
            message: "Profile updated successfully",
            profile: updatedProfile,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "Failed",
            message: "Internal server error",
            error: error.message,
        });
    }
});

