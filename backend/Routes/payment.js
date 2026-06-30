import User from "../Schema/user.js";
import express from "express";
import Stripe from "stripe";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { sendSubscriptionConfirmedEmail } from "../Services/email/email.js";

const FRONTEND_URL = process.env.FRONTEND_URL ? process.env.FRONTEND_URL : "http://localhost:5173"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});

const router = express.Router();

router.post('/save-card', authMiddleware, async (req, res) => {
    const { paymentMethod } = req.body;

    try {
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found!" });

        // Create or retrieve customer
        let customer = await stripe.customers.list({ email: user.email });

        if (!customer.data.length) {
            customer = await stripe.customers.create({ email: user.email });
        } else {
            customer = customer.data[0];
        }

        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
            customer: customer.id,
        });

        // Save Stripe customer ID to the user in MongoDB
        user.stripeId = customer.id;
        await user.save();

        res.status(200).json({
            message: "Card saved successfully",
            customerId: customer.id,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Create Checkout Session
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const type = user.type === "Parents" ? "family" : "nanny";
        const { priceId } = req.body;

        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${FRONTEND_URL}/${type}/pricing?status=success`,
            cancel_url: `${FRONTEND_URL}/${type}/pricing?status=cancelled`,
            metadata: { userId: user._id.toString() },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create checkout session" });
    }
});

router.post('/create-payment', authMiddleware, async (req, res) => {
    const { paymentMethodId, amount } = req.body; // ✅ get amount from frontend

    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found!" });

        // Create or retrieve Stripe customer
        let customer = await stripe.customers.list({ email: user.email });
        if (!customer.data.length) {
            customer = await stripe.customers.create({ email: user.email });
        } else {
            customer = customer.data[0];
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount, // ✅ use dynamic amount
            currency: "usd",
            customer: customer.id,
            payment_method: paymentMethodId,
            off_session: true,
            confirm: true,
            metadata: {
                userId,
            },
        });

        res.status(200).json({
            message: "Payment successful",
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).json({ error: error.message });
    }
});



router.get('/get-save-cards', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found!" });

        // Check if user has a Stripe ID
        if (!user.stripeId) {
            return res.status(404).json({ message: "No Cards found for the user!" });
        }

        // List payment methods for the Stripe customer
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeId,
            type: 'card',  // Assuming you want to retrieve only card payment methods
        });

        res.status(200).json(paymentMethods);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete-card/:paymentMethodId', authMiddleware, async (req, res) => {
    const { paymentMethodId } = req.params;
    const userId = req.userId;
    try {
        // Find user by ID
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found!" });

        // Check if user has a Stripe ID
        if (!user.stripeId) {
            return res.status(400).json({ message: "No Stripe customer found for this user." });
        }

        // Detach the payment method from the customer
        await stripe.paymentMethods.detach(paymentMethodId);

        res.status(200).json({ message: "Card removed successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/create-subscription", authMiddleware, async (req, res) => {
    const { paymentMethodId, planPriceId } = req.body;
    const userId = req.userId;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Create or retrieve customer
        let customer = await stripe.customers.list({ email: user.email });
        if (!customer.data.length) {
            customer = await stripe.customers.create({
                email: user.email,
            });
        } else {
            customer = customer.data[0];
        }

        // 🔥 Attach the payment method to the customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
        });

        // 🔐 Set it as default payment method
        await stripe.customers.update(customer.id, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: planPriceId }],
            expand: ['latest_invoice.payment_intent'],
            metadata: { userId },
        });

        // Save subscription ID to user
        user.stripeId = customer.id;
        user.subscriptionId = subscription.id;
        user.premium = true;
        await user.save();

        // Subscription is active — send the confirmation email (non-blocking)
        sendSubscriptionConfirmedEmail(user.email, user.name).catch((err) =>
            console.error("Failed to send subscription email:", err)
        );

        res.status(200).json({
            message: "Subscription created",
            subscriptionId: subscription.id,
        });
    } catch (error) {
        console.error("Subscription error:", error);
        res.status(500).json({ error: error.message });
    }
});


router.post('/cancel-subscription', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.subscriptionId) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        const subscription = await stripe.subscriptions.update(user.subscriptionId, {
            cancel_at_period_end: true,
        });

        res.status(200).json({
            message: "Subscription set to cancel at period end",
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: subscription.current_period_end,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/subscription-status', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.subscriptionId) {
            return res.json({ active: false });
        }

        const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);

        res.json({
            active: subscription.status === "active",
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            periodEnd: subscription.current_period_end,
            plan: subscription.items.data[0].price.nickname || "Unknown Plan",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
