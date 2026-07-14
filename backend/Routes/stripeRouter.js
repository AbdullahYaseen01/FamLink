import User from "../Schema/user.js";
import Revenue from "../Schema/revenue.js";
import express from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});

// No fallback: a wrong signing secret fails every delivery silently, and `premium`
// is only ever set from this handler — so a customer would pay and stay on Free.
// The live and test endpoints have different secrets; this must come from the env.
const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhook_secret) {
    console.error(
        "STRIPE_WEBHOOK_SECRET is not set. Stripe webhooks will be rejected, " +
        "so subscriptions will never be activated. Set it from the signing secret " +
        "of the endpoint in the Stripe dashboard."
    );
}

const router = express.Router();

router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        console.log("Webhook hit!");

        const sig = req.headers["stripe-signature"];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                webhook_secret
            );
        } catch (err) {
            console.error("Webhook signature verification failed.", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case "checkout.session.completed": {
                    const session = event.data.object;
                    const userId = session.metadata?.userId;
                    const customerId = session.customer;
                    const subscriptionId = session.subscription;

                    if (!userId) {
                        console.warn("Missing userId in session metadata.");
                        break;
                    }

                    // Retrieve subscription details
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    // Update user with subscription info. `premium` gates
                    // paid features elsewhere (e.g. match limits), so it must be
                    // set here — the Checkout flow never touches it otherwise.
                    const isActive =
                        subscription.status === "active" ||
                        subscription.status === "trialing";
                    await User.findByIdAndUpdate(userId, {
                        subscriptionId,
                        subscriptionStatus: subscription.status,
                        premium: isActive,
                    });

                    // Create a Revenue record
                    const amountPaid = session.amount_total || 0;
                    await Revenue.create({
                        userId,
                        stripeCustomerId: customerId,
                        subscriptionId,
                        amount: amountPaid,
                        currency: session.currency,
                        paidAt: new Date(),
                        type: "initial",
                    });

                    console.log(`💰 Recorded initial revenue: $${amountPaid / 100}`);
                    break;
                }

                // ✅ For recurring billing payments
                case "invoice.payment_succeeded": {
                    const invoice = event.data.object;
                    const subscriptionId = invoice.subscription;
                    const customerId = invoice.customer;
                    const amountPaid = invoice.amount_paid || 0;

                    // Find user by subscription
                    const user = await User.findOne({ subscriptionId });
                    if (!user) {
                        console.warn("User not found for recurring payment.");
                        break;
                    }

                    await Revenue.create({
                        userId: user._id,
                        stripeCustomerId: customerId,
                        subscriptionId,
                        amount: amountPaid,
                        currency: invoice.currency,
                        paidAt: new Date(invoice.created * 1000),
                        type: "renewal",
                    });

                    console.log(`🔁 Recorded renewal: $${amountPaid / 100}`);
                    break;
                }

                // ✅ Subscription cancelled / ended
                case "customer.subscription.deleted":
                case "customer.subscription.updated": {
                    const subscription = event.data.object;
                    const user = await User.findOne({ subscriptionId: subscription.id });
                    if (user) {
                        user.subscriptionStatus = subscription.status;
                        user.premium =
                            subscription.status === "active" ||
                            subscription.status === "trialing";
                        await user.save();
                        console.log(`🔔 Subscription ${subscription.status} for ${user.email}`);
                    }
                    break;
                }

                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.status(200).send("Webhook received");
        } catch (err) {
            console.error("Webhook processing failed:", err);
            res.status(500).send("Server error");
        }
    }
);


export default router;