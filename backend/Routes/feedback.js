// routes/feedback.js
import express from 'express';
import Feedback from '../Schema/feedback.js';
import { sendEmail, sendFeedbackReceivedEmail } from '../Services/email/email.js';
import User from '../Schema/user.js';
import { authMiddleware } from '../Services/utils/middlewareAuth.js';

const router = express.Router();

// Acknowledge the person who wrote in (email 21).
//
// Until this existed the form notified the admins and told the sender nothing,
// so from their side feedback went into a void — which is a poor thing to do
// generally, and actively self-defeating given email 15 goes out and ASKS for
// this. It also invites a reply, so the two would contradict each other.
//
// Fire-and-forget, exactly like notifyAdmin above: the feedback is already
// saved by the time this runs, and a mail failure must not turn a successful
// submission into an error the person sees (they would submit again).
function acknowledgeSubmitter(feedback) {
  (async () => {
    try {
      // Personalise when the address belongs to a member. The form only asks
      // for an email, so this is the only way to know a name — and "Hi there"
      // is a perfectly good fallback when it isn't one.
      const user = await User.findOne({ email: feedback.email }).select("name").lean();

      await sendFeedbackReceivedEmail(feedback.email, user?.name, {
        category: feedback.category,
        message: feedback.message,
      });
    } catch (error) {
      console.error("❌ Feedback acknowledgement failed:", error?.message || error);
    }
  })();
}

function notifyAdmin(feedback) {
  (async () => {
    try {
      const { message, category, email } = feedback;

      // Fetch all Admins
      const adminsToNotify = await User.find({ type: "Admin" }, "email");

      if (adminsToNotify.length === 0) return

      const adminEmails = adminsToNotify.map((admin) => admin.email);

      // Email content for Admins
      const adminSubject = "📢 New Feedback Received";
      const adminMessage = `
      <div style="padding: 12px; font-family: Arial, sans-serif;">
        <h2 style="color: #14558F;">New Feedback Submitted</h2>
        <p><b>Category:</b> ${category}</p>
        <p><b>From:</b> ${email}</p>
        <p><b>Message:</b></p>
        <div style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
          ${message}
        </div>
        <br>
        <a href="https://admin.famylink.us/" 
           style="padding: 10px 15px; background: #14558F; color: white; text-decoration: none; border-radius: 5px;">
          View Dashboard
        </a>
      </div>
    `;

      // Send notification to all admins
      for (const adminEmail of adminEmails) {
        sendEmail(adminEmail, adminSubject, adminMessage);
      }

      console.log(`✅ Feedback notification sent to ${adminEmails.length} admins`);
    } catch (error) {
      console.error("❌ Error sending feedback notifications:", error);
    }
  })();
}

// GET /api/feedback
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.type !== "Admin") {
      // console.log("user Id:", req.userId)
      // console.log("User", user)
      // console.log("Can't view feedbacks")
      return res.status(403).json({ message: "Access denied" });
    }

    const feedbacks = await Feedback.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      feedbacks,
    });

  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});



// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const { message, category, email } = req.body;

    if (!message || message.trim() === '' || !category || !email) {
      return res.status(400).json({ message: 'Feedback is required.' });
    }

    const feedback = new Feedback({ message: message, category: category, email: email });
    await feedback.save();
    notifyAdmin(feedback)
    acknowledgeSubmitter(feedback)
    res.status(201).json({ message: 'Feedback saved successfully!' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
