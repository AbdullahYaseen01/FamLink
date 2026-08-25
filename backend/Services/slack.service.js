import axios from "axios";

const WEBHOOK_BY_SOURCE = {
  FB: "SLACK_WEBHOOK_FB_GROUPS",
  Craigslist: "SLACK_WEBHOOK_CRAIGSLIST",
  Nextdoor: "SLACK_WEBHOOK_NEXTDOOR",
  BPN: "SLACK_WEBHOOK_BPN",
  Peanut: "SLACK_WEBHOOK_PEANUT",
};

function buildSlackMessage(lead) {
  let tempEmoji = "🧊";
  if (lead.leadTemperature && lead.leadTemperature.toUpperCase().includes("HOT"))
    tempEmoji = "🔥";
  if (lead.leadTemperature && lead.leadTemperature.toUpperCase().includes("WARM"))
    tempEmoji = "☀️";

  let priorityEmoji = "⭐";
  if (lead.priorityTier && lead.priorityTier.includes("1"))
    priorityEmoji = "🚨 TIER 1 (CONTACT FIRST)";
  else if (lead.priorityTier && lead.priorityTier.includes("2"))
    priorityEmoji = "🌟 TIER 2 (STRONG)";
  else if (lead.priorityTier && lead.priorityTier.includes("3"))
    priorityEmoji = "🌱 TIER 3 (FUTURE)";
  else if (lead.priorityTier && lead.priorityTier.includes("4"))
    priorityEmoji = "👀 TIER 4 (WEAK)";
  else if (lead.priorityTier) priorityEmoji = lead.priorityTier;

  let locationText = lead.city ? `${lead.city}` : lead.zone || "Unknown";
  if (lead.locationStatus === "OUT_OF_ZONE_FUTURE") {
    locationText += " 🌍 (Future Expansion Waitlist)";
  } else if (lead.locationStatus === "IN_ZONE") {
    locationText += " 📍 (In-Zone)";
  }

  let markdownText = `*New ${lead.source || "FB"} Lead Detected!*\n\n*Name:* ${lead.name || "—"}\n*Priority:* ${priorityEmoji}\n*Temperature:* ${tempEmoji} ${lead.leadTemperature || "N/A"}\n*Lead Type:* ${lead.leadType || lead.userType || "N/A"}\n*Potential Share:* ${lead.potentialShareType || "N/A"}\n*Location:* ${locationText}\n*Urgency:* ${lead.urgency || "N/A"}\n*Status:* ${lead.processingStatus || "—"}\n*Conversion Path:* ${lead.conversionPath || "N/A"}`;

  if (lead.incomingMessage) {
    markdownText += `\n\n*Message Received:*\n💬 *"${lead.incomingMessage}"*`;
  }

  if (lead.directLink) {
    markdownText += `\n\n👉 <${lead.directLink}|Click here for Direct Link>`;
  }

  return {
    text: `New Lead (${lead.source || "FB"}) — ${lead.name || lead.directLink || "unknown"}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: markdownText,
        },
      },
    ],
  };
}

async function postViaIncomingWebhook(source, payload) {
  const envKey = WEBHOOK_BY_SOURCE[source] || WEBHOOK_BY_SOURCE.FB;
  const url = process.env[envKey] || process.env.SLACK_WEBHOOK_FB_GROUPS;
  if (!url) {
    throw new Error("No Slack incoming webhook configured for this source");
  }
  await axios.post(url, payload);
}

/**
 * Post a single-lead notification to Slack.
 * Prefers bot+channel; falls back to source incoming webhook.
 * Rejects on failure so callers can await and catch.
 */
export async function sendLeadToSlack(lead) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_CHANNEL_ID;
  const payload = buildSlackMessage(lead);

  if (token && channelId) {
    const res = await axios.post(
      "https://slack.com/api/chat.postMessage",
      { channel: channelId, text: payload.text, blocks: payload.blocks },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.data?.ok) {
      throw new Error(res.data?.error || "Slack chat.postMessage failed");
    }
    return;
  }

  await postViaIncomingWebhook(lead.source || "FB", payload);
}
