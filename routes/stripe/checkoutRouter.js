// routes/stripe/checkoutRouter.js
const express = require('express');
const { incrementUsage, getUsage } = require('../../Controllers/stripe/usageController');
const { checkUsage } = require('../../Controllers/stripe/checkUsageController');
const checkoutRouter = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

checkoutRouter.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId, userId, planName } = req.body;
      

        // Create a maddy seeion 
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription', // or 'payment' for one-time
            success_url: `${process.env.APP_DEEP_LINK || 'https://delicate-squid-legally.ngrok-free.app'}/success`,
            cancel_url: `${process.env.APP_DEEP_LINK || 'https://delicate-squid-legally.ngrok-free.app'}/canceled`,
            metadata: {
                userId: userId.toString(),
                planName: planName.toString(),
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

checkoutRouter.post('/usage/increment', incrementUsage);

// Get usage for a user and feature
checkoutRouter.get('/usage/getUsage', getUsage);

checkoutRouter.post('/check-usage', checkUsage);
module.exports = checkoutRouter;