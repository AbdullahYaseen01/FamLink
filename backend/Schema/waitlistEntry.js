import mongoose from "mongoose";

const { Schema } = mongoose;

// Everyone who finished the intake questions, whether or not we serve their
// area yet and whether or not they went on to create an account.
//
// This is a fourth capture collection and the duplication is deliberate, so
// here is why none of the existing three could answer the question:
//
//   Schema/onboardingLead.js  — only holds people who did NOT create an account,
//                               and is documented as write-only (never read back
//                               to a client), because it stores exact
//                               coordinates unprotected.
//   Schema/user.js            — only holds people who DID.
//   Schema/lead.js            — outbound prospects scraped for Slack triage.
//                               Never completed anything.
//
// The waitlist view needs the union, sorted and paged as one list, filtered by
// city, and exported. Doing that across two collections at query time means
// paging two cursors and merging in application code — which is where the
// "export all of Oakland" button quietly starts dropping rows. So capture
// writes here as well, and this collection is the one thing the admin screen
// reads.
//
// One row per email address. Someone who fills in the form, comes back a week
// later and then finally registers is one person on the waitlist, not three.
const waitlistEntrySchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  },

  name: { type: String, trim: true, default: "" },

  // "Parents" or "Nanny", matching User.type so the two are directly
  // comparable. Not the User enum itself — a waitlist entry can predate any
  // decision about the account, and "Admin" is never a valid answer here.
  userType: {
    type: String,
    enum: ["Parents", "Nanny", "unknown"],
    default: "unknown",
    index: true,
  },

  // Coarse location only: city, region, zip and the formatted string. NO
  // COORDINATES. The admin screen shows a city and filters by one; it never
  // needs a point, and this collection — unlike onboardingLead — IS serialised
  // back to a client, so the exact home location must not be in it to leak.
  location: {
    city: { type: String, trim: true, default: "", index: true },
    region: { type: String, trim: true, default: "" },
    neighborhood: { type: String, trim: true, default: "" },
    zip: { type: String, trim: true, default: "", index: true },
    formatted: { type: String, trim: true, default: "" },
  },

  // Whether their zip falls in the launch radius, resolved at capture time
  // against Services/utils/serviceArea.js.
  //
  // Stored rather than computed on read because the radius expands: when a new
  // city opens, the people who were outside it are exactly the people to email,
  // and that list is only recoverable if we recorded where they stood at the
  // time. The admin screen recomputes the live answer separately.
  insideLaunchRadius: { type: Boolean, default: false, index: true },

  // Did they tick the box asking to be told when Famlink opens in their area.
  // This is the consent that gates the launch email, so it defaults to false and
  // is only ever set by an explicit true from the form.
  notifyConsent: { type: Boolean, default: false, index: true },

  // Set when the launch announcement actually went out to them, so re-running a
  // city's send does not mail the same person twice. Null means "still waiting".
  launchNotifiedAt: { type: Date, default: null },

  // Which funnel they completed.
  source: {
    type: String,
    enum: [
      "family-match",
      "caregiver-job",
      "caregiver-share",
      "waitlist-form",
      "registration",
      "backfill",
      "unknown",
    ],
    default: "unknown",
    index: true,
  },

  // When they finished the intake questions. Distinct from `createdAt`: the
  // backfill writes rows long after the fact, and the admin table is sorted and
  // filtered on when the person actually completed, not when we recorded it.
  onboardingCompletedAt: { type: Date, default: Date.now, index: true },

  // Set once they register. Turns the waitlist into a conversion funnel: rows
  // with a userId converted, rows without are still waiting.
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    default: null,
    index: true,
  },

  // Honours the footer unsubscribe for an address with no account, the same way
  // onboardingLead does. Checked alongside notifyConsent before any send.
  unsubscribedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// The launch-notification query: everyone in a city who consented and hasn't
// been told yet.
waitlistEntrySchema.index({ "location.city": 1, notifyConsent: 1, launchNotifiedAt: 1 });

const WaitlistEntry = mongoose.model("waitlistentries", waitlistEntrySchema);

export default WaitlistEntry;
