const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        otp: { type: String },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: Date.now, expires: 900 }, // OTP expires in 15 minutes
    },
    { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
