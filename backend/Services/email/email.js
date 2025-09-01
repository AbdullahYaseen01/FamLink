import nodemailer from "nodemailer";

// Load environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_USER = process.env.EMAIL_USER || ""; // Your Email address
const EMAIL_PASS = process.env.EMAIL_PASS || ""; // Your Email app password
const EMAIL_PORT = 587;// Default port for SMTP

// Create the transporter
const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Not recommended for production
    },
});

// Function to send OTP email
export const sendOtpEmail = (email, otp) => {
    const mailOptions = {
        from: `"Famlink Support" <noreply@famlink.care>`, // Make it look professional
        to: email,
        subject: "🔐 Verify Your Email - OTP Inside!",
        html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
                <div style="max-width: 500px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #4A90E2; font-size: 22px; margin-bottom: 10px;">🔒 Email Verification</h2>
                    <p style="font-size: 16px; color: #333;">Hey there! You're one step away from unlocking full access.</p>
                    <p style="font-size: 18px; font-weight: bold; color: #ff6b6b;">Your OTP Code:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #4A90E2; background: #f0f0f0; padding: 10px 20px; border-radius: 8px; display: inline-block;">
                        ${otp}
                    </p>
                    <p style="font-size: 14px; color: #666;">This code expires in 2 minutes. Please do not share it with anyone.</p>
                    <p style="font-size: 12px; color: #999; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                </div>
            </div>
        `
    };


    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

export const sendEmail = (email, subject, text) => {
    const mailOptions = {
        from: 'noreply@famlink.care',
        to: email,
        subject,
        html: text,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

export const sendEmailConfirmation = (email, subject, text) => {
    const mailOptions = {
        from: `"Email Confirmation – Famlink Newsletter" <noreply@famlink.care>`,
        to: email,
        subject,
        html: text,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

// Queue-based sender with feedback loop
export const sendWithLimit = async (emails, subject, html, batchSize = 2, delayMs = 1500) => {
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);

        // Send batch in parallel (small batch to avoid throttling)
        const results = await Promise.allSettled(
            batch.map(email =>
                transporter.sendMail({
                    from: 'noreply@famlink.care',
                    to: email,
                    subject,
                    html,
                })
            )
        );

        results.forEach(result => {
            if (result.status === "fulfilled") successCount++;
            else {
                failCount++;
                console.error("Email failed:", result.reason);
            }
        });

        // Delay before next batch
        if (i + batchSize < emails.length) await new Promise(r => setTimeout(r, delayMs));
    }

    console.log(`✅ Emails sent: ${successCount}, Failed: ${failCount}`);
};

