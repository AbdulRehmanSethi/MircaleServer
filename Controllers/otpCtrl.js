const OTP = require("../models/otpModel");

const storeOtpInDB = async (email, otp) => {
    const otpData = {
        email,
        otp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // OTP expires in 15 minutes
    };
    await OTP.create(otpData);
};


module.exports = { storeOtpInDB };
