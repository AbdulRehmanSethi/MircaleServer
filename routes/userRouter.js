const express = require("express");

const {
  sendOtpCtrl,
  googleSignupCtrl,
  registerCtrl,
  loginCtrl,
} = require("../Controllers/userCtrl");
const { verifyOtp } = require("../utils/otp");
const userRouter = express();
userRouter.post("/register", verifyOtp, registerCtrl);
userRouter.post("/sendOTP/:email", sendOtpCtrl);
userRouter.post("/google-signup", googleSignupCtrl);
userRouter.post("/login", loginCtrl);
// userRouter.get("/profile/:userId", getUserProfileCtrl);

module.exports = userRouter;
