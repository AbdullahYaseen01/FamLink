import crypto from "crypto";
import OpenAI from "openai";
import axios from "axios";
import { createObjectCsvStringifier } from "csv-writer";
import pLimit from "p-limit";
import Lead from "../Schema/lead.js";
import RawLead from "../Schema/rawLead.js";

// Lazy client — constructing OpenAI at import time with a missing key can
// break boot for the whole API even when this webhook is unused.
let openai;
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const LEAD_TYPE_ENUM = ["Parent", "Caregiver", "Nanny Share", "Unknown"];
const ZONE_ENUM = ["In-Zone", "Outside-Zone", "Unknown"];

const AI_PROMPT_BASE = `
You are a highly accurate data classifier. Analyze the provided Facebook profile data.
Your job is to categorize the profile into ONE of the following:
1. "Parent": MUST have indicators (mentions children, family, seeking care, parental leave). Do not assume they are a parent just because of the group name.
2. "Caregiver": MUST have indicators (job titles like nanny, babysitter, au pair, CPR certified, or seeking employment).
3. "Nanny Share": MUST mention seeking another family to split costs or "nanny share".
4. "Unknown": Legitimate profiles that lack sufficient context in their bio to be placed in the above three categories. (e.g., they list a generic job, university, or have no bio). IMPORTANT: You MUST keep these profiles (status: "keep"). Do not drop them for lacking context!
5. "Drop": If the profile meets ANY of these strict exclusion rules:
   - Incomplete / Placeholder Names (e.g., User123, A B, initials only).
   - Company / Agency Profiles (Actual businesses, daycares, or corporate nanny agencies. Normal job titles like "Product Designer" or "Coach" are fine, DO NOT drop them).
   - Suspicious Names / Scam Indicators.
   - Recently Created / New Accounts (ONLY drop if memberSince says "Joined today" or "Joined this week". "Joined months ago" is perfectly fine).

Also, attempt to extract:
- "location": The city they live in (if mentioned). Leave blank if not mentioned.
- "zone_status": If their location is in the SF Bay Area (e.g., Oakland, Berkeley, San Francisco, Alameda, Emeryville), return "In-Zone". Otherwise, return "Outside-Zone". If no location, return "Unknown".
- "children_age": The age of their children (if mentioned). Leave blank if not mentioned.

Return ONLY a strict JSON object with this exact structure:
{
  "status": "keep" (or "drop"),
  "category": "Parent" (or "Caregiver", "Nanny Share", "Unknown"),
  "context_clues": "A short 1-sentence reason why you chose this category based on their bio/job/groupName.",
  "location": "Oakland",
  "zone_status": "In-Zone",
  "children_age": "2 years old"
}
`;

const AI_PROMPT_VISION_EXTRA = `
   - No Profile Picture (if the provided image indicates a default silhouette).
`;

function buildAiPrompt() {
  if (process.env.ENABLE_VISION_CHECK === "true") {
    return AI_PROMPT_BASE.replace(
      "5. \"Drop\": If the profile meets ANY of these strict exclusion rules:\n",
      `5. "Drop": If the profile meets ANY of these strict exclusion rules:\n${AI_PROMPT_VISION_EXTRA}`
    );
  }
  return AI_PROMPT_BASE;
}

function extractDirectLink(record) {
  return (
    record.profileURL ||
    record.profileUrl ||
    record.ProfileUrl ||
    record["Profile Url"] ||
    record["profileUrl"] ||
    record["Profile URL"] ||
    record.directLink ||
    ""
  );
}

function parseRawLeads(body) {
  let rawLeads = [];
  if (Array.isArray(body)) {
    rawLeads = body;
  } else if (body && Array.isArray(body.data)) {
    rawLeads = body.data;
  } else if (body && Array.isArray(body.resultObject)) {
    rawLeads = body.resultObject;
  } else if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      rawLeads = Array.isArray(parsed)
        ? parsed
        : parsed.data || parsed.resultObject || [];
    } catch {
      // ignore
    }
  }
  return Array.isArray(rawLeads) ? rawLeads : [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sanitizeEnum(value, allowed, defaultValue, fieldName, review) {
  if (value == null || value === "") {
    return defaultValue;
  }
  if (allowed.includes(value)) return value;
  review.needsReview = true;
  review.reasons.push(`AI returned out-of-enum value: ${fieldName}=${value}`);
  return defaultValue;
}

async function categorizeProfileWithAI(profileData, profilePicture) {
  const enableVision = process.env.ENABLE_VISION_CHECK === "true";
  const userContent = enableVision
    ? [
        { type: "text", text: JSON.stringify(profileData) },
        ...(profilePicture
          ? [{ type: "image_url", image_url: { url: profilePicture, detail: "low" } }]
          : []),
      ]
    : JSON.stringify(profileData);

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildAiPrompt() },
      { role: "user", content: userContent },
    ],
    temperature: 0.1,
  });

  return JSON.parse(response.choices[0].message.content);
}

async function categorizeWithRetry(profileData, profilePicture) {
  const maxRetries = Number(process.env.AI_MAX_RETRIES) || 3;
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await categorizeProfileWithAI(profileData, profilePicture);
    } catch (error) {
      lastError = error;
      const backoff = 500 * 2 ** attempt + Math.floor(Math.random() * 200);
      console.error(
        `AI attempt ${attempt + 1}/${maxRetries} failed: ${error.message}; retry in ${backoff}ms`
      );
      await sleep(backoff);
    }
  }
  throw lastError;
}

async function upsertLead(directLink, fields) {
  try {
    await Lead.updateOne(
      { directLink },
      {
        $set: fields,
        $setOnInsert: { outreachStatus: "new" },
      },
      { upsert: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      await Lead.updateOne({ directLink }, { $set: fields });
      return;
    }
    throw err;
  }
}

async function markRaw(id, status, lastError) {
  const update = { $set: { status }, $inc: { attempts: 1 } };
  if (lastError !== undefined) update.$set.lastError = lastError;
  await RawLead.updateOne({ _id: id }, update);
}

async function processOneLead(rawDoc) {
  try {
    const record = rawDoc.raw || {};
    const name = record.name || record.Name || "Unknown";
    const profileURL = rawDoc.directLink || extractDirectLink(record);
    const additionalData =
      record.additionalData ||
      record.bio ||
      record.job ||
      record.description ||
      "No extra info provided";
    const profilePicture = record.profilePicture || record.imageURL || "";
    const memberSince = record.memberSince || "";
    const groupName = record.groupName || "";

    if (!profileURL) {
      await markRaw(rawDoc._id, "failed", "no profile link");
      return;
    }

    const bioEmpty =
      !additionalData ||
      additionalData === "No extra info provided" ||
      String(additionalData).trim() === "";
    if (name === "Unknown" && bioEmpty) {
      await markRaw(rawDoc._id, "failed", "Unknown name and empty bio");
      return;
    }

    let processingStatus = "processed";
    let reviewReason = "";
    const review = { needsReview: false, reasons: [] };

    if (!profilePicture) {
      processingStatus = "needs_review";
      reviewReason = "no profile picture";
    }

    let aiResult;
    try {
      aiResult = await categorizeWithRetry(
        {
          name,
          bio_or_job: additionalData,
          profilePicture: profilePicture || undefined,
          memberSince,
          groupName,
        },
        profilePicture
      );
    } catch (aiErr) {
      await upsertLead(profileURL, {
        source: "FB",
        name,
        leadType: "Unknown",
        zone: "Unknown",
        processingStatus: "needs_review",
        reviewReason: "AI classification failed after retries",
        contextClues: aiErr.message,
        batchId: rawDoc.batchId,
        rawLeadId: rawDoc._id,
      });
      await markRaw(rawDoc._id, "failed", aiErr.message);
      return;
    }

    if (aiResult.category === "Error") {
      await upsertLead(profileURL, {
        source: "FB",
        name,
        leadType: "Unknown",
        zone: "Unknown",
        processingStatus: "needs_review",
        reviewReason: "AI classification failed after retries",
        contextClues: aiResult.context_clues || "",
        batchId: rawDoc.batchId,
        rawLeadId: rawDoc._id,
      });
      await markRaw(rawDoc._id, "failed", "AI returned category Error");
      return;
    }

    // AI status "drop" = scam/placeholder — quarantine, don't vanish
    if (aiResult.status === "drop") {
      processingStatus = "needs_review";
      reviewReason = aiResult.context_clues || "AI marked as drop";
    }

    const leadType = sanitizeEnum(
      aiResult.category,
      LEAD_TYPE_ENUM,
      "Unknown",
      "leadType",
      review
    );
    const zone = sanitizeEnum(
      aiResult.zone_status || "Unknown",
      ZONE_ENUM,
      "Unknown",
      "zone",
      review
    );

    if (review.needsReview) {
      processingStatus = "needs_review";
      reviewReason = [reviewReason, ...review.reasons].filter(Boolean).join("; ");
    }

    await upsertLead(profileURL, {
      source: "FB",
      name,
      leadType,
      zone,
      city: aiResult.location || "",
      childAge: aiResult.children_age || "",
      contextClues: aiResult.context_clues || "",
      processingStatus,
      reviewReason: reviewReason || undefined,
      batchId: rawDoc.batchId,
      rawLeadId: rawDoc._id,
    });

    await markRaw(rawDoc._id, "processed");
    console.log(`✅ Processed: ${name} -> [${leadType}] (${processingStatus})`);
  } catch (err) {
    console.error(`processOneLead error for ${rawDoc._id}:`, err.message);
    await markRaw(rawDoc._id, "failed", err.message).catch(() => {});
  }
}

async function uploadBufferToSlack(buffer, filename, initialComment) {
  if (!process.env.SLACK_BOT_TOKEN) {
    console.warn("SLACK_BOT_TOKEN unset — skipping Slack upload");
    return;
  }
  const channelId = process.env.SLACK_CHANNEL_ID;
  if (!channelId) {
    console.warn("SLACK_CHANNEL_ID unset — skipping Slack upload");
    return;
  }

  try {
    const length = Buffer.byteLength(buffer);
    const getUrlRes = await axios.get(
      "https://slack.com/api/files.getUploadURLExternal",
      {
        params: { filename, length },
        headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
      }
    );

    if (!getUrlRes.data.ok) {
      console.error(
        `❌ Slack failed to provide an upload URL. Reason: ${getUrlRes.data.error}`
      );
      return;
    }
    const { upload_url, file_id } = getUrlRes.data;

    await axios.post(upload_url, buffer, {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        "Content-Type": "text/csv",
      },
    });

    const completeRes = await axios.post(
      "https://slack.com/api/files.completeUploadExternal",
      {
        files: [{ id: file_id, title: filename }],
        channel_id: channelId,
        initial_comment: initialComment,
      },
      { headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` } }
    );

    if (!completeRes.data.ok) {
      console.error(
        `❌ Slack rejected completion of ${filename}. Reason: ${completeRes.data.error}`
      );
    } else {
      console.log(`✅ Successfully uploaded ${filename} to Slack`);
    }
  } catch (error) {
    console.error(
      `❌ Failed to upload ${filename} to Slack:`,
      error.response?.data || error.message
    );
  }
}

function rowsToCsvBuffer(rows) {
  const stringifier = createObjectCsvStringifier({
    header: [
      { id: "Name", title: "Name" },
      { id: "ProfileURL", title: "Profile URL" },
      { id: "Category", title: "Category" },
      { id: "Location", title: "Location" },
      { id: "ZoneStatus", title: "Zone Status" },
      { id: "ChildrenAge", title: "Children Age" },
      { id: "ContextClues", title: "Context Clues" },
      { id: "ProcessingStatus", title: "Processing Status" },
      { id: "ReviewReason", title: "Review Reason" },
    ],
  });
  const csv =
    stringifier.getHeaderString() + stringifier.stringifyRecords(rows);
  return Buffer.from(csv, "utf8");
}

async function uploadBatchCsvs(batchId) {
  const leads = await Lead.find({ batchId }).lean();
  const byType = {
    Parent: [],
    Caregiver: [],
    "Nanny Share": [],
    Unknown: [],
  };

  for (const lead of leads) {
    const row = {
      Name: lead.name || "",
      ProfileURL: lead.directLink || "",
      Category: lead.leadType || "Unknown",
      Location: lead.city || "",
      ZoneStatus: lead.zone || "Unknown",
      ChildrenAge: lead.childAge || "",
      ContextClues: lead.contextClues || "",
      ProcessingStatus: lead.processingStatus || "",
      ReviewReason: lead.reviewReason || "",
    };
    const key = byType[lead.leadType] ? lead.leadType : "Unknown";
    byType[key].push(row);
  }

  const needsReviewCount = leads.filter(
    (l) => l.processingStatus === "needs_review"
  ).length;

  const uploads = [
    ["Parent", "parents", "👶 Found some new Parents! Here is the list:"],
    ["Caregiver", "caregivers", "🍼 Found some new Caregivers! Here is the list:"],
    ["Nanny Share", "nanny_shares", "🤝 Found some new Nanny Shares! Here is the list:"],
    ["Unknown", "unknown", "❓ Found some Unknown profiles. Here is the list:"],
  ];

  for (const [type, slug, comment] of uploads) {
    const rows = byType[type];
    if (!rows.length) continue;
    const buf = rowsToCsvBuffer(rows);
    await uploadBufferToSlack(
      buf,
      `${slug}_${batchId}.csv`,
      `${comment} (batch ${batchId}; needs_review in batch: ${needsReviewCount})`
    );
  }

  const summary =
    `🎉 Batch \`${batchId}\` done.\n` +
    `Leads: ${leads.length} | needs_review: ${needsReviewCount}\n` +
    `Parents ${byType.Parent.length} | Caregivers ${byType.Caregiver.length} | ` +
    `Nanny Shares ${byType["Nanny Share"].length} | Unknowns ${byType.Unknown.length}`;

  // Text summary via incoming webhook when channel uploads are unavailable
  const fbHook = process.env.SLACK_WEBHOOK_FB_GROUPS;
  if (fbHook && !process.env.SLACK_CHANNEL_ID) {
    try {
      await axios.post(fbHook, { text: summary });
    } catch (err) {
      console.error("Slack webhook summary failed:", err.message);
    }
  }

  console.log(summary);
}

export async function processBatch(batchId) {
  const rawDocs = await RawLead.find({ batchId, status: "pending" });
  const concurrency = Number(process.env.AI_CONCURRENCY) || 8;
  const limit = pLimit(concurrency);

  await Promise.allSettled(
    rawDocs.map((doc) => limit(() => processOneLead(doc)))
  );

  await uploadBatchCsvs(batchId);
}

export async function resumePendingLeads() {
  const maxRetries = Number(process.env.AI_MAX_RETRIES) || 3;
  const pending = await RawLead.distinct("batchId", {
    $or: [
      { status: "pending" },
      { status: "failed", attempts: { $lt: maxRetries } },
    ],
  });

  if (!pending.length) {
    console.log("No pending/failed raw leads to resume");
    return;
  }

  console.log(`Resuming ${pending.length} batch(es)...`);
  for (const batchId of pending) {
    if (!batchId) continue;
    // Reset failed under retry budget to pending for re-processing
    await RawLead.updateMany(
      { batchId, status: "failed", attempts: { $lt: maxRetries } },
      { status: "pending" }
    );
    try {
      await processBatch(batchId);
    } catch (err) {
      console.error(`resume batch ${batchId} failed:`, err.message);
    }
  }
}

export const processPhantombusterWebhook = async (req, res) => {
  try {
    console.log("🚀 Webhook Received! Starting Facebook Lead Processing...");

    const rawLeads = parseRawLeads(req.body);
    if (!rawLeads.length) {
      console.error(
        "❌ Could not find an array of leads in the webhook payload",
        req.body
      );
      return res
        .status(400)
        .json({ error: "Invalid payload format. Expected an array of leads." });
    }

    const batchId = crypto.randomUUID();
    const docs = rawLeads.map((record) => ({
      batchId,
      source: "FB",
      directLink: extractDirectLink(record),
      raw: record,
      status: "pending",
      attempts: 0,
    }));

    try {
      await RawLead.insertMany(docs, { ordered: false });
    } catch (insertErr) {
      console.error("❌ Raw lead persist failed:", insertErr.message);
      return res.status(500).json({ error: "Failed to persist raw leads" });
    }

    console.log(
      `✅ Persisted ${docs.length} raw profiles (batch ${batchId}). Responding 200.`
    );
    res.status(200).json({
      message: "received",
      batchId,
      count: docs.length,
    });

    processBatch(batchId).catch((err) => {
      console.error(`Unhandled processBatch error (${batchId}):`, err);
    });
  } catch (error) {
    console.error("❌ Error in Webhook processing:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
