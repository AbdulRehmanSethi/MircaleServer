const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const subscriptionModel = require('../../models/subscriptionModel');

// Stripe webhook handler
exports.stripeWebhookHandler = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case "checkout.session.completed":
                const session = event.data.object;
                await handleCheckoutSession(session);
                break;

            case "invoice.paid":
                const invoice = event.data.object;
                await handleRenewal(invoice);
                break;

            case "customer.subscription.deleted":
                const subscription = event.data.object;
                await handleCancellation(subscription);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.status(200).send();
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send();
    }
};

// Handle successful checkout session
async function handleCheckoutSession(session) {
    const userId = session.metadata.userId;
    const planName = session.metadata.planName;
    const subscriptionId = session.subscription;

    // Update the subscription in the database
    await subscriptionModel.findOneAndUpdate(
        { userId },
        {
            planName,
            stripeSubscriptionId: subscriptionId,
            status: 'active',
            startDate: new Date(),
        },
        { upsert: true, new: true }
    );

    console.log(`User ${userId} subscribed to ${planName} with subscription ID: ${subscriptionId}`);
}

// Handle subscription renewal
async function handleRenewal(invoice) {
    const subscriptionId = invoice.subscription;

    // Update the subscription end date in the database
    await subscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
            endDate: new Date(invoice.period_end * 1000), // Convert Unix timestamp to Date
        }
    );

    console.log(`Subscription renewed: ${subscriptionId}`);
}

// Handle subscription cancellation
async function handleCancellation(subscription) {
    const subscriptionId = subscription.id;

    // Mark the subscription as canceled in the database
    await subscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
            status: 'canceled',
            endDate: new Date(),
        }
    );

    console.log(`Subscription canceled: ${subscriptionId}`);
}