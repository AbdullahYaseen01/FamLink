import mongoose from "mongoose";
const { Schema } = mongoose;

const nannyProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    unique: true,
  },





  //**FAMILY PROFILE**





  // Page 1: Basic Info
  nannyShareType: { type: String, required: true }, // Full-time, Part-time, Pickup/Drop-off, After-school, Summer/Seasonal, Other
  otherShareTypeSpecify: { type: String }, // Optional if "Other" is selected
  hasNanny: { type: Boolean, required: true },
  shareLocation: { type: [String], required: true },
  specifyNearbyWorkplace: { type: String },

  // Page 2: Schedule & Hosting
  specificDays: {
    type: Schema.Types.Mixed,
    required: true,
  },
  scheduleNotes: { type: String }, // optional
  flexibility: { type: String }, // Very / Somewhat / Not flexible
  hostingPreference: { type: String }, // Your home, Other home, Rotate, Neutral
  hostingSpecify: { type: String }, // optional "Other" text
  nannyshareStart: { type: String },
  urgency: { type: String },

  // Page 3: Children’s Details
  numberOfChildren: { type: Number },
  childrenAges: [
    {
      label: { type: String },
      value: { type: Number },
      unit: { type: String, enum: ["months", "years"] },
    }
  ],
  childrenSchools: { type: String }, // optional
  allergiesHealth: { type: [String] }, // Food allergies, Asthma, etc.
  allergiesHealthSpecify: { type: String }, // optional

  // Page 4: Responsibilities
  childResponsibilities: { type: [String] }, // Transportation, Homework, Nap, etc.
  householdAddOns: { type: [String] }, // Grocery, Meal prep, Errands, optional
  responsibilitiesNA: { type: Boolean, default: false }, // N/A toggle

  // Page 5: Parenting Style & House Rules
  parentingStyle: { type: [String] }, // Montessori, Attachment, etc.
  parentingStyleSpecify: { type: String },
  houseRules: { type: [String] }, // Screen time, Diet, Hygiene, etc.
  houseRulesSpecify: { type: String },

  // Preferred nanny language(s). New with the six-step family questionnaire —
  // families had no way to state this before, so there is no legacy data.
  preferredNannyLanguages: { type: [String] }, // English, Spanish, ASL, No preference, etc.
  preferredNannyLanguagesSpecify: { type: String }, // set only when "Other" is chosen

  // Page 6: Daily Routine / Activities
  dailyRoutine: { type: [String] }, // Nap, Outdoor play, Storytime, Arts & Crafts, etc.
  dailyRoutineNA: { type: Boolean, default: false },

  // Page 7: Budget & Pets
  hourlyBudget: {
    type: Schema.Types.Mixed,
  }, // $10–$15/hr, etc.
  hourlyBudgetSpecify: { type: Number },
  pets: { type: [String], }, // Dog, Cat, None, etc.
  petsSpecify: { type: String },

  // Page 8: Communication & Backup
  //
  // Both are [String] because the questionnaire asks them as multi-selects: a
  // family can want a group chat AND a shared calendar, and can name several
  // backup options. They were declared as single String, which strict:false does
  // not rescue -- Mongoose still casts declared paths, so an array assignment
  // throws a CastError.
  //
  // Documents written before this hold a plain string. Mongoose coerces those to
  // a one-element array on hydration, but .lean() reads (share.controller.js)
  // bypass casting and hand back the raw string, so read-side code has to
  // tolerate either shape.
  communicationPreference: { type: [String] }, // Group chat, Shared calendar, Email, Phone, etc.
  communicationSpecify: { type: String }, // optional
  backupCare: { type: [String] }, // Family members, Backup nanny service, No backup options, etc.
  backupCareSpecify: { type: String }, // optional
  involvementLevel: { type: String }, // Very / Moderate / Minimal

  // Page 9: Open Notes
  openNotes: { type: String }, // optional free-text

  //Miscelleneous
  Seasonal: {
    startDate: { type: Date },
    endDate: { type: Date }
  },
  careDescription: { type: String },





  //**CAREGIVER PROFILE**






  careExperience: {
    type: String,
  },

  careType: {
    type: String,
  },
  careDistance: {
    type: String,
  },

  specificDays: {
    type: Schema.Types.Mixed,
  },

  hasFamily: {
    type: Boolean,
    required: true
  },

  /* -------- SHARE COMPATIBILITY -------- */
  shareExperience: String,
  multiFamilyComfort: String,

  childrenCapacity: {
    type: String,
  },

  // AFTER
  preferredAges: [
    {
      label: { type: String },
      min: { type: Number },
      max: { type: Number },
    }
  ],

  forWho: String,
  // Dead path. The "already with a family" questionnaire asks how many children
  // are currently in the nanny's care (its Q2) and stores the answer in
  // numberOfChildren, which is what LoginAsNanny/editProfile.jsx reads back —
  // nothing has ever written this one. Left declared rather than removed because
  // { strict: false } means a stray document could still carry it.
  numChildrenCare: String,
  agesCare: [String],
  currentSchedule: String,
  joinTiming: String,
  together: String,

  // Q8 of the "already with a family" questionnaire: how many ADDITIONAL
  // children the nanny can take on, and their ages.
  //
  // Deliberately separate from numberOfChildren/childrenAges, which that same
  // questionnaire fills with the children already in her care. The two lists
  // describe different children and both are shown on the profile, so folding
  // them together would claim she is minding twice as many as she is.
  openToChildren: { type: Number },
  // Mirrors childrenAges' shape exactly — `value` is a Number normalised to
  // years — so the same formatter renders both lists.
  openToChildrenAges: [
    {
      label: { type: String },
      value: { type: Number },
      unit: { type: String, enum: ["months", "years"] },
    }
  ],

  // Q23 reveal: which pets are in the home the nanny works from. Written only
  // when hasPets is "Yes"; the mirror family question stores its answer in
  // `pets`, which is a different home.
  petTypes: { type: [String] },
  petTypesSpecify: { type: String }, // set only when "Other" is chosen

  workSetup: {
    type: String,
  },

  /* -------- AVAILABILITY -------- */
  // availability: {
  //   type: Schema.Types.Mixed,
  //   required: true,
  // },

  startAvailability: {
    type: String,
  },

  /* -------- ROLE & EXPECTATIONS -------- */
  responsibilities: [
    {
      type: String,
    },
  ],

  householdHelp: {
    type: String,
  },

  /* -------- TRUST -------- */
  hasTransport: String,
  backgroundCheck: String,

  /* -------- PAY -------- */
  sharedRate: String,
  soloRate: String,
  rateType: String,

  budget: {
    type: Schema.Types.Mixed,
  },

  /* -------- PROFILE -------- */
  bio: String,

  // Written by LoginAsNanny/editProfile.jsx since it shipped, and already in the
  // controller's JSON_FIELDS list — but never a declared path. It persisted only
  // because this schema carries { strict: false }, which means nothing has ever
  // cast or validated it. Declaring it is a correctness fix, not new surface.
  languages: { type: [String] },
  languagesSpecify: { type: String }, // set only when "Other" is chosen

  certifications: [
    {
      type: String,
    },
  ],

  certificationsSpecify: { type: String }, // set only when "Other" is chosen
  customCertifications: String,
  skills: String,

  imageFile: String,

  // The photo the questionnaire's final step uploads.
  //
  // Written alongside imageFile rather than instead of it: imageFile is what the
  // browse cards and the public share page already read, so writing only this
  // field would upload a photo that never appears anywhere. Kept as its own path
  // so a later change can tell a share-listing photo apart from the account
  // avatar without guessing.
  profilePhoto: String,


  /* -------- PUBLIC SHARE LINK -------- */
  // Opaque token behind /share/:token — the privacy-safe public view of this
  // profile that the owner posts to Facebook groups, WhatsApp, Nextdoor etc.
  // Minted on first use (see Services/utils/shareProfile.js) and never rotated,
  // so a link already out in the world keeps resolving. `sparse` because every
  // profile that predates the feature has no token and they must not collide
  // on null.
  shareToken: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Whether the link currently resolves. The admin console toggles this per
  // user, and the public route checks it before serving anything.
  //
  // Separate from the token on purpose. Revoking by deleting the token would
  // mean the next "enable" mints a new one and every URL already pasted into a
  // Facebook group is dead — so turning a share back on would silently fail to
  // restore it. A boolean makes the switch actually reversible: the same URL
  // goes dark and comes back.
  //
  // Defaults true so every profile that predates this field keeps working; a
  // default of false would take every live share link down on deploy.
  shareEnabled: {
    type: Boolean,
    default: true,
  },

  // Who last flipped the switch and when. The link is a public listing of a
  // family's schedule and children's ages, so "who turned this on" is worth
  // being able to answer.
  shareDisabledAt: { type: Date, default: null },
  shareToggledBy: { type: Schema.Types.ObjectId, ref: "users", default: null },

  // Who minted the token, and when.
  //
  // The same helper serves both paths — a member opening their own share sheet
  // and an admin generating one on their behalf — so without recording it there
  // is no way afterwards to tell a listing the member chose to publish from one
  // the office created for them. That distinction matters: "did they ask for
  // this to be public" is the first question worth asking about a page carrying
  // a family's schedule and their children's ages.
  //
  // Written once, at mint, inside the same atomic update that sets the token
  // (Services/utils/shareProfile.js). Never rewritten — the token is never
  // rotated, so its origin does not change either.
  shareTokenCreatedAt: { type: Date, default: null },

  // "member" when the owner generated it themselves, "admin" when the console
  // did. Null on every profile whose token predates these fields; the console
  // renders that as "Unknown" rather than guessing, because the two cases are
  // genuinely indistinguishable in the stored data.
  shareTokenSource: {
    type: String,
    enum: ["member", "admin", null],
    default: null,
  },

  // The admin who generated it, when the source was the console. Null for
  // member-generated links — the owner is already known from `userId`.
  shareTokenCreatedBy: { type: Schema.Types.ObjectId, ref: "users", default: null },

  // Count of public views, incremented by the public share route. The console
  // shows it so an admin can see which listings are actually getting traffic
  // before spending effort promoting them.
  shareViewCount: { type: Number, default: 0 },
  shareLastViewedAt: { type: Date, default: null },


  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { strict: false });

export default mongoose.model("nannyprofiles", nannyProfileSchema);