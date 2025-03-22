const express = require("express");
const bodyParser = require("body-parser");
const { stripeWebhookHandler } = require("../../Controllers/stripe/webhookController");

const webHookRouter = express.Router();

// Stripe webhook route
webHookRouter.post(
    "/stripe",
    bodyParser.raw({ type: "application/json" }), // Ensure the body is raw for Stripe signature verification
    stripeWebhookHandler
);

module.exports = webHookRouter;
