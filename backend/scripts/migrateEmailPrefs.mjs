import "dotenv/config";
import mongoose from "mongoose";

// Fold the eight per-topic email flags into the two categories the Settings
// screen now offers.
//
// ────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
//
// notifications.email used to hold eight booleans — newMessage,
// backgroundCheck, safetyNoti, newRecoLists, tipsAndTricks, ref, disAccInfo,
// newSubInArea. Schema/user.js now declares only platformUpdates and
// newsletter.
//
// Mongoose does not backfill: a document written under the old schema keeps its
// eight fields and has neither new one. Every send path reads `{ $ne: false }`,
// so an unmigrated user is treated as subscribed to both — which is right for
// the majority, and wrong in the one case that matters. Someone who
// deliberately switched a topic off, or clicked Unsubscribe in a footer, would
// start receiving mail again. That is the bug this script exists to prevent,
// so run it as part of the same deploy as the schema change.
//
// ── How the eight map onto the two ──────────────────────────────────────────
//
//   platformUpdates ← newMessage, backgroundCheck, safetyNoti, newRecoLists,
//                     ref, disAccInfo, newSubInArea
//   newsletter      ← tipsAndTricks
//
// A missing old flag counts as ON, matching both the old schema default and
// how the send paths read it.
//
// platformUpdates is ON if ANY of its seven sources was on, not if all were.
// The seven were never independently meaningful to the person receiving the
// mail, and the asymmetry is deliberate: reading a single topic-level opt-out
// as a full unsubscribe would silently cut someone off from messages they
// never asked to stop getting. A genuine unsubscribe set all eight to false
// and still lands correctly on both-off.
//
// Idempotent — skips any document that already has both new fields, so it is
// safe to re-run and safe to run while the new code is already live.
//
//   node scripts/migrateEmailPrefs.mjs [--dry]
// ────────────────────────────────────────────────────────────────────────────

const DRY = process.argv.includes("--dry");

const PLATFORM_SOURCES = [
  "newMessage",
  "backgroundCheck",
  "safetyNoti",
  "newRecoLists",
  "ref",
  "disAccInfo",
  "newSubInArea",
];

const OLD_KEYS = [...PLATFORM_SOURCES, "tipsAndTricks"];

const run = async () => {
  if (!process.env.MONGO_DB_URI) {
    console.error("MONGO_DB_URI is not set. Run this from the backend directory.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_DB_URI);
  console.log(`connected to ${mongoose.connection.name}${DRY ? "  (dry run)" : ""}\n`);

  // Driver-level, not through the User model: the model no longer declares the
  // old fields, so a model read would hand back documents with the very values
  // this script needs to inspect already stripped out.
  const users = mongoose.connection.collection("users");

  // Every user, not just those with a notifications.email key. The oldest
  // accounts predate the field entirely; they need the two written just as much
  // as the rest, so that "does this document say what we send it?" has the same
  // answer for every row in the collection.
  const cursor = users.find({}, { projection: { "notifications.email": 1 } });

  let migrated = 0;
  let skipped = 0;
  let unsubscribed = 0;
  const ops = [];

  const flush = async () => {
    if (!ops.length || DRY) {
      ops.length = 0;
      return;
    }
    await users.bulkWrite(ops, { ordered: false });
    ops.length = 0;
  };

  for await (const user of cursor) {
    const prefs = user.notifications?.email || {};

    // Already migrated — leave it alone. Recomputing would overwrite a choice
    // the member has made since, using old flags that are no longer authoritative.
    if (
      typeof prefs.platformUpdates === "boolean" &&
      typeof prefs.newsletter === "boolean"
    ) {
      skipped += 1;
      continue;
    }

    const platformUpdates = PLATFORM_SOURCES.some((key) => prefs[key] !== false);
    const newsletter = prefs.tipsAndTricks !== false;

    if (!platformUpdates && !newsletter) unsubscribed += 1;

    ops.push({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            "notifications.email.platformUpdates": platformUpdates,
            "notifications.email.newsletter": newsletter,
          },
          $unset: OLD_KEYS.reduce((acc, key) => {
            acc[`notifications.email.${key}`] = "";
            return acc;
          }, {}),
        },
      },
    });

    migrated += 1;
    if (ops.length >= 500) await flush();
  }

  await flush();

  console.log(
    `${migrated} migrated, ${skipped} already had both fields.\n` +
      `${unsubscribed} of the migrated are opted out of both (previously unsubscribed).`
  );

  // Verification, counted from the database rather than from the loop above —
  // a tally of what we meant to write proves nothing about what landed. The
  // second count is the one that matters: an old flag left behind would sit
  // there being read by nothing, and its absence is how we know the collection
  // holds exactly two email booleans per user and no stale ninth.
  const [total, missing, stale] = await Promise.all([
    users.countDocuments({}),
    users.countDocuments({
      $or: [
        { "notifications.email.platformUpdates": { $not: { $type: "bool" } } },
        { "notifications.email.newsletter": { $not: { $type: "bool" } } },
      ],
    }),
    users.countDocuments({
      $or: OLD_KEYS.map((key) => ({ [`notifications.email.${key}`]: { $exists: true } })),
    }),
  ]);

  console.log(
    `\nverify: ${total - missing}/${total} users have both fields as booleans; ` +
      `${stale} still carry a legacy flag.`
  );

  if (DRY) {
    console.log("\nDry run — nothing was written; the counts above are the current state.");
  } else if (missing > 0 || stale > 0) {
    console.error("\nIncomplete — re-run the script.");
    await mongoose.disconnect();
    process.exit(1);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error("Migration failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
