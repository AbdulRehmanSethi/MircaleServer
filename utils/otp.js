const OTPModel = require("../models/otpModel");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const CLIENT_ID = "566988908807-hn2hrpmjmdhaaciha1knhv0psjjvo11s.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:8080";
const REFRESH_TOKEN = "1//046a-h8zVhGvSCgYIARAAGAQSNwF-L9IrABaOS1PewDrSEz1FiEWpH6_8t-vhfOxFpQ_yTGgJqEufuYZAFqdkGD0Vb_E8xxkzcrc";
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const generateRandomOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const sendOtpEmail = async (email, otp, name) => {
    // Use EmailJS, Nodemailer, or another service to send the OTP
    const sent = await sendEmail(
        email,
        `Your Verification Code`,
        `Dear Sir/Ma'am , your otp is: ${otp}. Enter this code in the app to verify your email.`
    );
    if (sent) {
        console.log(otp);
        return otp;
    }
    return null;
};

const sendEmail = async (email, subject, text) => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        // Nodemailer transporter with OAuth2
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                type: "OAuth2",
                user: "abiha.mniops@gmail.com", // Your email
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });

        transporter.verify((error, success) => {
            if (error) {
                console.log("Transporter verification error:", error);
            } else {
                console.log("Server is ready to send emails.");
            }
        });

        const mailOptions = {
            from: "Your-AI <your-email@gmail.com>",
            to: email,
            subject: subject,
            text: text,
        };

        console.log("Sending email to:", email);
        const result = await transporter.sendMail(mailOptions);
        console.log("Email sent:", result.response);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otpCode } = req.body; // Destructure correctly

        // Assuming you have an OTP model
        const otpData = await OTPModel.findOne({ email }); // Replace 'otp' with 'OTPModel'

        if (!otpData) {

            return res.status(401).send({ error: "No OTP found for this email." });

        }

        // Check if OTP has expired
        if (otpData.expiresAt < new Date()) {

            return res.status(401).send({ error: "OTP has expired." });

        }

        // Check if OTP is incorrect
        if (otpData.otp !== otpCode) {
            return res.status(401).send({ error: "Invalid OTP." });
        }

        // If all checks pass, proceed to the next middleware or controller
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Server error." });
    }
};

module.exports = {

    generateRandomOTP,
    sendOtpEmail,
    verifyOtp,
    sendEmail
};
