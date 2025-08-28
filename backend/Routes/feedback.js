// routes/feedback.js
import express from 'express';
import Feedback from '../Schema/feedback.js';
import { sendEmail } from '../Services/email/email.js';
import User from '../Schema/user.js';

const router = express.Router();

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
    res.status(201).json({ message: 'Feedback saved successfully!' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
