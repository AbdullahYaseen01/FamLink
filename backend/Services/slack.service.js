import axios from "axios";

// This function acts as the "Messenger". It takes the lead data we saved
// and forwards it to the correct Slack channel.
export const sendLeadToSlack = async (lead) => {
  try {
    // 1. Pick the correct Webhook URL based on where the lead came from
    let webhookUrl = "";
    switch (lead.source) {
      case "FB":
        webhookUrl = process.env.SLACK_WEBHOOK_FB_GROUPS;
        break;
      case "Craigslist":
        webhookUrl = process.env.SLACK_WEBHOOK_CRAIGSLIST;
        break;
      case "Nextdoor":
        webhookUrl = process.env.SLACK_WEBHOOK_NEXTDOOR;
        break;
      case "BPN":
        webhookUrl = process.env.SLACK_WEBHOOK_BPN;
        break;
      case "Peanut":
        webhookUrl = process.env.SLACK_WEBHOOK_PEANUT;
        break;
      default:
        console.error("Unknown lead source:", lead.source);
        return;
    }

    // If the URL is missing from the .env file, we stop here to prevent a crash
    if (!webhookUrl) {
      console.error(`Slack webhook URL missing for source: ${lead.source}`);
      return;
    }

    // 2. Pick the correct Urgency Emoji (as requested!)
    let urgencyEmoji = "🟢"; // Default to Low
    if (lead.urgency === "High") urgencyEmoji = "🔴";
    if (lead.urgency === "Medium") urgencyEmoji = "🟡";
    if (lead.urgency === "Low") urgencyEmoji = "🟢";

    // 3. Pick the correct User Type Emoji (based on your manual)
    let userTypeEmoji = "❓";
    if (lead.userType === "Infant") userTypeEmoji = "👶";
    if (lead.userType === "After-School/Camp") userTypeEmoji = "🎒";
    if (lead.userType === "Weekend/Date Night") userTypeEmoji = "🌃";
    if (lead.userType === "Caregiver") userTypeEmoji = "💼";

    // 4. Format a beautiful message for Slack
    let zoneText = "";
    if (lead.zone === "Out-of-Zone") {
      zoneText = "\n*Location:* 🌍 Out of Famlink Zone (Waitlist)";
    } else {
      zoneText = "\n*Location:* 📍 In-Zone";
    }

    const slackMessage = {
      text: "New Lead Detected!", // Fallback text for notifications
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*New ${lead.source} Lead Detected!*\n\n*Urgency:* ${urgencyEmoji} ${lead.urgency}\n*Type:* ${userTypeEmoji} ${lead.userType}${zoneText}\n\n👉 <${lead.directLink}|Click here for Direct Link>`
          }
        }
      ]
    };

    // 5. Send the message to Slack using axios
    await axios.post(webhookUrl, slackMessage);
    console.log(`Successfully sent ${lead.source} lead to Slack!`);

  } catch (error) {
    console.error("Failed to send message to Slack:", error.message);
  }
};
