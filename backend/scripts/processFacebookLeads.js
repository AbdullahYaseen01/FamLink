import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup directories
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import axios from 'axios';
import FormData from 'form-data';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Ensure OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ ERROR: OPENAI_API_KEY is missing in your .env file!");
    process.exit(1);
}

// Initialize OpenAI connection
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Configure where we read the messy list and where we save the clean lists
const INPUT_FILE = path.join(__dirname, '../raw_fb_group.csv');
const OUTPUT_PARENTS = path.join(__dirname, '../parents_list.csv');
const OUTPUT_CAREGIVERS = path.join(__dirname, '../caregivers_list.csv');
const OUTPUT_NANNY_SHARES = path.join(__dirname, '../nanny_shares_list.csv');
const OUTPUT_UNKNOWN = path.join(__dirname, '../unknown_list.csv');

// The system prompt that tells ChatGPT exactly how to categorize people
const AI_PROMPT = `
You are a highly accurate data classifier. Analyze the provided Facebook profile data.
Your job is to categorize the profile into ONE of the following:
1. "Parent": MUST have indicators (mentions children, family, seeking care, parental leave). Do not assume they are a parent just because of the group name.
2. "Caregiver": MUST have indicators (job titles like nanny, babysitter, au pair, CPR certified, or seeking employment).
3. "Nanny Share": MUST mention seeking another family to split costs or "nanny share".
4. "Unknown": Legitimate profiles that lack sufficient context in their bio to be placed in the above three categories. (e.g., they list a generic job, university, or have no bio). IMPORTANT: You MUST keep these profiles (status: "keep"). Do not drop them for lacking context!
5. "Drop": If the profile meets ANY of these strict exclusion rules:
   - Incomplete / Placeholder Names (e.g., User123, A B, initials only).
   - No Profile Picture (if the provided profilePicture URL indicates a default silhouette).
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
  "context_clues": "A short 1-sentence reason why you chose this category based on their bio/job.",
  "location": "Oakland",
  "zone_status": "In-Zone",
  "children_age": "2 years old"
}
`;

async function categorizeProfileWithAI(profileData) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using the fast/cheap model
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: AI_PROMPT },
                { role: "user", content: JSON.stringify(profileData) }
            ],
            temperature: 0.1, // Keep it highly predictable
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

        // Step 1: Request an upload URL from Slack
        const getUrlRes = await axios.get('https://slack.com/api/files.getUploadURLExternal', {
            params: { filename: filename, length: length },
            headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
        });

        if (!getUrlRes.data.ok) {
            console.error(`❌ Slack failed to provide an upload URL. Reason: ${getUrlRes.data.error}`);
            return;
        }
        const { upload_url, file_id } = getUrlRes.data;

        // Step 2: Upload the actual file data to that URL
        await axios.post(upload_url, fileBuffer, {
            headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
        });

        // Step 3: Tell Slack to officially publish the file to your channel
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

async function processLeads() {
    console.log("🚀 Starting Facebook Lead Processing...");
    const rawLeads = [];

    // Step 1: Read the CSV file
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ ERROR: Could not find raw_fb_group.csv. Make sure the file is in your backend folder!`);
        return;
    }

    fs.createReadStream(INPUT_FILE)
        .pipe(csvParser())
        .on('data', (row) => {
            rawLeads.push(row);
        })
        .on('end', async () => {
            console.log(`✅ Read ${rawLeads.length} profiles from the file.`);
            console.log("🧠 Sending profiles to AI for sorting (this may take a few minutes)...");

            const parents = [];
            const caregivers = [];
            const nannyShares = [];
            const unknowns = [];

            // Step 2: Loop through each profile and ask the AI
            for (let i = 0; i < rawLeads.length; i++) {
                const record = rawLeads[i];
                const name = record.name || record.Name || "Unknown";
                const profileURL = record.profileURL || record.profileUrl || record.ProfileUrl || record['Profile Url'] || record['profileUrl'] || record['Profile URL'] || "";
                const additionalData = record.additionalData || record.bio || record.job || record.description || "No extra info provided";
                const profilePicture = record.profilePicture || record.imageURL || "";
                const memberSince = record.memberSince || "";

                // For now, friend count logic is commented out as requested until data is available in exports
                // const friendCount = parseInt(record.friendCount) || parseInt(record.friends) || null;
                // if (friendCount !== null && friendCount < 50) {
                //     console.log(`Dropping ${name} (Low friend count)`);
                //     continue;
                // }

                // Very basic immediate drops before wasting money on AI
                const hasNumbers = /\d/.test(name); // Names with numbers are suspicious
                const isPlaceholder = name.length <= 3 || name.toLowerCase().includes("test");

                if (name === "Unknown" || !profileURL || name.split(' ').length < 2 || hasNumbers || isPlaceholder) {
                    console.log(`Dropping ${name} (Incomplete name, placeholder, or missing link)`);
                    continue;
                }

                if (!profilePicture) {
                    console.log(`Dropping ${name} (No profile picture)`);
                    continue;
                }

                // Ask the AI!
                const aiResult = await categorizeProfileWithAI({
                    name: name,
                    bio_or_job: additionalData,
                    profilePicture: profilePicture,
                    memberSince: memberSince
                });

                if (aiResult.status === "keep") {
                    const cleanRecord = {
                        Name: name,
                        ProfileURL: profileURL,
                        Category: aiResult.category,
                        Location: aiResult.location || "",
                        ZoneStatus: aiResult.zone_status || "Unknown",
                        ChildrenAge: aiResult.children_age || "",
                        ContextClues: aiResult.context_clues
                    };

                    console.log(`✅ Kept: ${name} -> [${aiResult.category}]`);

                    if (aiResult.category.includes("Parent")) parents.push(cleanRecord);
                    else if (aiResult.category.includes("Caregiver")) caregivers.push(cleanRecord);
                    else if (aiResult.category.includes("Share")) nannyShares.push(cleanRecord);
                    else if (aiResult.category.includes("Unknown")) unknowns.push(cleanRecord);
                } else {
                    console.log(`❌ Dropped: ${name} (Reason: ${aiResult.context_clues})`);
                }
            }

            // Step 3: Save to new CSV files
            console.log("💾 Saving sorted lists to CSV files...");

            const createWriter = (path) => createObjectCsvWriter({
                path: path,
                header: [
                    { id: 'Name', title: 'Name' },
                    { id: 'ProfileURL', title: 'Profile URL' },
                    { id: 'Category', title: 'Category' },
                    { id: 'Location', title: 'Location' },
                    { id: 'ZoneStatus', title: 'Zone Status' },
                    { id: 'ChildrenAge', title: 'Children Age' },
                    { id: 'ContextClues', title: 'Context Clues' }
                ]
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

            console.log("🎉 All done! Check the backend folder for your new CSV files.");
            console.log(`Results: ${parents.length} Parents | ${caregivers.length} Caregivers | ${nannyShares.length} Nanny Shares | ${unknowns.length} Unknowns`);
        });
}

// Run the function
processLeads();
