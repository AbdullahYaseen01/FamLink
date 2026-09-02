import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import {
    AI_PROMPT,
    CSV_HEADER,
    parseLead,
    dropBeforeAI,
    bucketOf,
    toCsvRow,
    capBatch,
} from '../Services/outreach/fbLeadFilter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

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

const OUTPUT_PARENTS = path.join(__dirname, '../parents_list.csv');
const OUTPUT_CAREGIVERS = path.join(__dirname, '../caregivers_list.csv');
const OUTPUT_NANNY_SHARES = path.join(__dirname, '../nanny_shares_list.csv');
const OUTPUT_UNKNOWN = path.join(__dirname, '../unknown_list.csv');

async function categorizeProfileWithAI(profileData) {
    try {
        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: AI_PROMPT },
                { role: "user", content: JSON.stringify(profileData) }
            ],
            temperature: 0.1,
        });

        const aiResult = JSON.parse(response.choices[0].message.content);
        return aiResult;
    } catch (error) {
        console.error(`Error asking AI: ${error.message}`);
        return { status: "drop", category: "Error", context_clues: "AI failure" };
    }
}

async function uploadFileToSlack(filePath, filename, initialComment) {
    if (!process.env.SLACK_BOT_TOKEN) return;
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const length = fileBuffer.length;
        const channelId = process.env.SLACK_CHANNEL_ID || 'C0BHW2WCE6S';

        const getUrlRes = await axios.get('https://slack.com/api/files.getUploadURLExternal', {
            params: { filename: filename, length: length },
            headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
        });

        if (!getUrlRes.data.ok) {
            console.error(`❌ Slack failed to provide an upload URL. Reason: ${getUrlRes.data.error}`);
            return;
        }
        const { upload_url, file_id } = getUrlRes.data;

        await axios.post(upload_url, fileBuffer, {
            headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
        });

        const completeRes = await axios.post('https://slack.com/api/files.completeUploadExternal', {
            files: [{ id: file_id, title: filename }],
            channel_id: channelId,
            initial_comment: initialComment
        }, {
            headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
        });

        if (!completeRes.data.ok) {
            console.error(`❌ Slack rejected completion of ${filename}. Reason: ${completeRes.data.error}`);
        } else {
            console.log(`✅ Successfully uploaded ${filename} to Slack`);
        }
    } catch (error) {
        console.error(`❌ Failed to upload ${filename} to Slack:`, error.response?.data || error.message);
    }
}

/** Kept so index.js can boot. RawLead resume lives on the committed durable pipeline. */
export async function processBatch() {}
export async function resumePendingLeads() {
  console.log("No pending/failed raw leads to resume");
}

export const processPhantombusterWebhook = async (req, res) => {
    try {
        console.log("🚀 Webhook Received! Starting Facebook Lead Processing...");

        let rawLeads = [];
        if (Array.isArray(req.body)) {
            rawLeads = req.body;
        } else if (req.body && Array.isArray(req.body.data)) {
            rawLeads = req.body.data;
        } else if (req.body && Array.isArray(req.body.resultObject)) {
            rawLeads = req.body.resultObject;
        } else if (typeof req.body === 'string') {
            try {
                const parsed = JSON.parse(req.body);
                rawLeads = Array.isArray(parsed) ? parsed : (parsed.data || parsed.resultObject || []);
            } catch (e) {
                // Ignore parse errors here
            }
        }

        if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
            console.error("❌ Could not find an array of leads in the webhook payload", req.body);
            return res.status(400).json({ error: "Invalid payload format. Expected an array of leads." });
        }

        console.log(`✅ Received ${rawLeads.length} profiles from PhantomBuster.`);
        rawLeads = capBatch(rawLeads);

        // Send a response immediately so PhantomBuster doesn't timeout while OpenAI is running
        res.status(200).json({ message: "Webhook received and processing started" });

        const buckets = { parents: [], caregivers: [], nannyShares: [], unknowns: [] };

        for (let i = 0; i < rawLeads.length; i++) {
            const lead = parseLead(rawLeads[i]);
            if (i > 0 && i % 100 === 0) console.log(`Processed ${i}/${rawLeads.length}`);

            const earlyDrop = dropBeforeAI(lead);
            if (earlyDrop) {
                console.log(`Dropping ${lead.name} (${earlyDrop})`);
                continue;
            }

            const aiResult = await categorizeProfileWithAI({
                name: lead.name,
                bio_or_job: lead.additionalData,
                profilePicture: lead.profilePicture,
                memberSince: lead.memberSince,
                groupName: lead.groupName,
                friendCount: lead.friendCount,
            });

            if (aiResult.status === "keep") {
                const cleanRecord = toCsvRow(lead, aiResult);
                buckets[bucketOf(cleanRecord.Category)].push(cleanRecord);
                console.log(`✅ Kept: ${lead.name} -> [${cleanRecord.Category}]`);
            } else {
                console.log(`❌ Dropped: ${lead.name} (Reason: ${aiResult.context_clues})`);
            }
        }

        const parents = buckets.parents;
        const caregivers = buckets.caregivers;
        const nannyShares = buckets.nannyShares;
        const unknowns = buckets.unknowns;

        console.log("💾 Saving sorted lists to CSV files...");

        const createWriter = (path) => createObjectCsvWriter({
            path: path,
            header: CSV_HEADER
        });

        if (parents.length > 0) {
            await createWriter(OUTPUT_PARENTS).writeRecords(parents);
            await uploadFileToSlack(OUTPUT_PARENTS, 'parents_list.csv', '👶 Found some new Parents! Here is the list:');
        }
        if (caregivers.length > 0) {
            await createWriter(OUTPUT_CAREGIVERS).writeRecords(caregivers);
            await uploadFileToSlack(OUTPUT_CAREGIVERS, 'caregivers_list.csv', '🍼 Found some new Caregivers! Here is the list:');
        }
        if (nannyShares.length > 0) {
            await createWriter(OUTPUT_NANNY_SHARES).writeRecords(nannyShares);
            await uploadFileToSlack(OUTPUT_NANNY_SHARES, 'nanny_shares_list.csv', '🤝 Found some new Nanny Shares! Here is the list:');
        }
        if (unknowns.length > 0) {
            await createWriter(OUTPUT_UNKNOWN).writeRecords(unknowns);
            await uploadFileToSlack(OUTPUT_UNKNOWN, 'unknown_list.csv', '❓ Found some Unknown profiles (lacked context). Here is the list:');
        }

        console.log("🎉 All done! Slack has been updated via Webhook.");
        console.log(`Results: ${parents.length} Parents | ${caregivers.length} Caregivers | ${nannyShares.length} Nanny Shares | ${unknowns.length} Unknowns`);

    } catch (error) {
        console.error("❌ Error in Webhook processing:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};
