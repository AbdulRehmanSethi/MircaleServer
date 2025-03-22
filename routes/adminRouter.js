const express = require("express");
const {
  getAllUsers,
  getUserDetails,
  updateUserFeatureUsage,
  updatePlan,
  getAllFeatures,
  updateFeatureLimit,
  sendemailToAllUsers,
  getUsersJoinedToday,
  getSubscriptionsUpdatedToday,
} = require("../Controllers/admin/adminCtrl");
const adminRouter = express.Router();

// Route to get all users
adminRouter.get("/getallusers", getAllUsers);
adminRouter.get("/getuserdetails/:userId", getUserDetails);
adminRouter.post("/updateUsage", updateUserFeatureUsage);
adminRouter.post("/updateplan", updatePlan);
adminRouter.get("/getallfeatures", getAllFeatures);
adminRouter.post("/updatefeaturelimit", updateFeatureLimit);
adminRouter.post("/send-email-to-all", sendemailToAllUsers);
adminRouter.get("/users-joined-today", getUsersJoinedToday);
adminRouter.get("/subscriptions-updated-today", getSubscriptionsUpdatedToday);

module.exports = adminRouter;
