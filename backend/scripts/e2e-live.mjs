/**
 * Full live E2E verification against real Atlas / Slack / OpenAI.
 * Run: node scripts/e2e-live.mjs
 */
import dns from "dns";
import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

const results = [];
const pass = (step, msg) => {
  results.push({ step, ok: true, msg });
  console.log(`✅ [${step}] ${msg}`);
};
const fail = (step, msg) => {
  results.push({ step, ok: false, msg });
  console.log(`❌ [${step}] ${msg}`);
};

const SECRET = process.env.WEBHOOK_SECRET;
const stamp = Date.now();
const linkA = `https://facebook.com/e2e-verify-${stamp}`;
const linkB = `https://facebook.com/e2e-ai-${stamp}`;

let server;
let port;

try {
  // --- 1. Mongo ---
  const uri = process.env.MONGODB_URI || process.env.MONGO_DB_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  pass("mongo", `connected to db "${mongoose.connection.name}"`);

  const Lead = (await import("../Schema/lead.js")).default;
  const RawLead = (await import("../Schema/rawLead.js")).default;

  // --- 2. Slack webhook ---
  try {
    await axios.post(process.env.SLACK_WEBHOOK_FB_GROUPS, {
      text: `🧪 E2E verify started (${new Date().toISOString()})`,
    });
    pass("slack-webhook", "FB Groups incoming webhook OK");
  } catch (e) {
    fail("slack-webhook", e.message);
  }

  // --- 3. OpenAI ---
  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: 'Reply with JSON {"ok":true}' }],
      response_format: { type: "json_object" },
      max_tokens: 20,
    });
    const content = r.choices[0].message.content;
    if (content.includes("ok")) pass("openai", `gpt-4o-mini OK: ${content}`);
    else fail("openai", `unexpected: ${content}`);
  } catch (e) {
    fail("openai", e.message);
  }

  // --- 4. Start app ---
  const { default: leadRoutes } = await import("../Routes/lead.routes.js");
  // Don't call resumePendingLeads here — keep E2E focused; index.js does that in prod
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use("/leads", leadRoutes);
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  port = server.address().port;
  pass("server", `listening on ${port}`);

  const base = `http://127.0.0.1:${port}`;

  // --- 5. Auth ---
  {
    const r = await fetch(`${base}/leads/incoming`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ directLink: linkA }),
    });
    if (r.status === 401) pass("auth", "no secret → 401");
    else fail("auth", `expected 401 got ${r.status}`);
  }

  // --- 6. createLead save ---
  {
    const r = await fetch(`${base}/leads/incoming`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": SECRET,
      },
      body: JSON.stringify({
        directLink: linkA,
        name: "E2E Verify User",
        source: "FB",
        leadType: "Parent",
        zone: "In-Zone",
        city: "Oakland",
      }),
    });
    const body = await r.json();
    if (r.status === 201 && body.data?.directLink === linkA) {
      pass("createLead", "201 saved to Mongo + Slack attempted");
    } else {
      fail("createLead", `${r.status} ${JSON.stringify(body)}`);
    }
  }

  // --- 7. Dedupe ---
  {
    const r = await fetch(`${base}/leads/incoming`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": SECRET,
      },
      body: JSON.stringify({
        directLink: linkA,
        name: "E2E Verify User Updated",
        source: "FB",
        leadType: "Parent",
        zone: "In-Zone",
      }),
    });
    const count = await Lead.countDocuments({ directLink: linkA });
    if (r.status === 200 && count === 1) pass("dedupe", "200 update, still 1 doc");
    else fail("dedupe", `status=${r.status} count=${count}`);
  }

  // --- 8. PhantomBuster pipeline ---
  let batchId;
  {
    const r = await fetch(`${base}/leads/phantombuster`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": SECRET,
      },
      body: JSON.stringify([
        {
          name: "Jane E2E",
          profileURL: linkB,
          bio: "Mom of a 2 year old in Oakland looking for a part-time nanny share",
          profilePicture: "https://via.placeholder.com/150",
          memberSince: "Joined years ago",
          groupName: "Bay Area Parents",
        },
        {
          name: "NoLink Person",
          bio: "should fail raw",
        },
        {
          name: "SoloName",
          profileURL: `https://facebook.com/e2e-solo-${stamp}`,
          bio: "Software engineer in Berkeley, joined a parents group",
          profilePicture: "https://via.placeholder.com/150",
          memberSince: "Joined months ago",
          groupName: "East Bay Parents",
        },
      ]),
    });
    const body = await r.json();
    batchId = body.batchId;
    if (r.status === 200 && body.message === "received" && body.count === 3 && batchId) {
      pass("webhook-ack", `200 received batchId=${batchId} count=3`);
    } else {
      fail("webhook-ack", `${r.status} ${JSON.stringify(body)}`);
    }

    const rawImmediate = await RawLead.countDocuments({ batchId });
    if (rawImmediate === 3) pass("durability", "raw_leads persisted before/with 200");
    else fail("durability", `raw count=${rawImmediate}`);
  }

  // Wait for async AI batch
  console.log("⏳ waiting for AI batch processing...");
  const deadline = Date.now() + 120000;
  let pending = 99;
  while (Date.now() < deadline) {
    pending = await RawLead.countDocuments({
      batchId,
      status: "pending",
    });
    if (pending === 0) break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  if (pending === 0) pass("batch-done", "no pending raw docs left");
  else fail("batch-done", `still ${pending} pending after timeout`);

  const raws = await RawLead.find({ batchId }).lean();
  const failedNoLink = raws.find((d) => !d.directLink || d.lastError === "no profile link");
  if (failedNoLink?.status === "failed") pass("filter", "no-link marked failed");
  else fail("filter", `no-link raw: ${JSON.stringify(failedNoLink?.status)}`);

  const leadB = await Lead.findOne({ directLink: linkB }).lean();
  if (leadB) {
    pass(
      "ai-upsert",
      `Jane leadType=${leadB.leadType} status=${leadB.processingStatus} zone=${leadB.zone}`
    );
  } else {
    fail("ai-upsert", "Jane lead missing from leads collection");
  }

  const solo = await Lead.findOne({
    directLink: `https://facebook.com/e2e-solo-${stamp}`,
  }).lean();
  if (solo) pass("relaxed-filter", `single-name SoloName reached AI → ${solo.leadType}`);
  else fail("relaxed-filter", "SoloName dropped before AI");

  // Schema fields
  if (leadB?.outreachStatus === "new" && leadB?.createdAt && leadB?.updatedAt) {
    pass("schema-live", "outreachStatus + timestamps present on live doc");
  } else if (leadB) {
    fail("schema-live", `outreach=${leadB.outreachStatus} created=${!!leadB.createdAt}`);
  }

  // Resume function import smoke
  const { resumePendingLeads } = await import("../Controllers/phantombuster.js");
  await resumePendingLeads();
  pass("resume", "resumePendingLeads() completed without throw");

  // Cleanup test docs (keep Slack noise low; remove test leads)
  await Lead.deleteMany({
    directLink: {
      $in: [linkA, linkB, `https://facebook.com/e2e-solo-${stamp}`],
    },
  });
  if (batchId) await RawLead.deleteMany({ batchId });
  pass("cleanup", "removed E2E test documents");
} catch (e) {
  fail("fatal", e.stack || e.message);
} finally {
  if (server) await new Promise((r) => server.close(r));
  if (mongoose.connection.readyState) await mongoose.disconnect();
}

console.log("\n—— E2E Summary ——");
const failed = results.filter((r) => !r.ok);
const passed = results.filter((r) => r.ok);
console.log(`Passed: ${passed.length} | Failed: ${failed.length}`);
if (failed.length) {
  failed.forEach((f) => console.log(`  FAIL [${f.step}] ${f.msg}`));
  process.exit(1);
}
console.log("ALL LIVE CHECKS PASSED");
process.exit(0);
