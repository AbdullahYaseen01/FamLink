import express from "express";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import User from "../Schema/user.js";
import { sendWelcomeEmail } from "../Services/email/email.js";

const router = express.Router();

// Admin-only: trigger a test email to verify the SMTP / OAuth2 setup end-to-end.
// Route: POST /debug/email-test
// Body (optional): { "email": "to@example.com", "name": "First" }
// Defaults to sending to the requesting admin's own email.
router.post("/email-test", authMiddleware, async (req, res) => {
    try {
        const requester = await User.findById(req.userId);

        if (!requester) {
            return res.status(401).json({ message: "Access denied" });
        }

        if (requester.type !== "Admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const to = (req.body?.email || requester.email || "").trim();
        const name = req.body?.name || requester.name || "there";

        if (!to) {
            return res.status(400).json({ message: "No recipient email available" });
        }

        const info = await sendWelcomeEmail(to, name);

        return res.status(200).json({
            ok: true,
            message: `Test email sent to ${to}`,
            response: info?.response,
            messageId: info?.messageId,
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            message: "Test email failed",
            error: err?.message || String(err),
        });
    }
});

export default router;
