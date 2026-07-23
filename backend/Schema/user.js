import mongoose from "mongoose";

const { Schema } = mongoose;

/* ---------------- LOCATION ---------------- */
const locationSchema = new Schema({
  type: {
    type: Schema.Types.String,
    enum: ["Point"],
    required: false,
  },
  coordinates: {
    type: [Number], // [lng, lat]
    required: false,
  },
  format_location: {
    type: Schema.Types.String,
    required: false,
  },
  city: {
    type: Schema.Types.String,
    required: false,
  },
  neighborhood: {
    type: Schema.Types.String,
    required: false,
  },
  distance: {
    type: Schema.Types.String,
    required: false,
  }
});

/* ---------------- REVIEWS ---------------- */
const reviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: "bookings",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  msg: {
    type: Schema.Types.String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/* ---------------- USER ---------------- */
const userSchema = new Schema({
  name: {
    type: Schema.Types.String,
    required: true,
  },

  email: {
    type: Schema.Types.String,
    required: true,
    unique: true,
  },

  goal: String,

  password: {
    type: Schema.Types.String,
  },

  /* -------- EXISTING -------- */
  sheetId: String,
  hasSubmittedSheetResponse: {
    type: Schema.Types.Boolean,
    default: false,
  },

  location: locationSchema,

  registeredVia: String,
  dob: Date,
  phoneNo: String,
  zipCode: String,

  services: [Schema.Types.String],
  noOfChildren: Schema.Types.Mixed,
  favourite: [Schema.Types.Mixed],

  type: {
    type: Schema.Types.String,
    enum: ["Parents", "Nanny", "Admin"],
    required: true,
  },

  ActiveAt: {
    type: Date,
    required: true,
  },

  online: {
    type: Boolean,
    default: false,
  },

  verified: {
    emailVer: { type: Boolean, default: false },
    phoneVer: { type: Boolean, default: false },
    nationalIDVer: {
      type: String,
      enum: ["false", "underprocess", "true"],
      default: "false",
    },
  },

  imageUrl: String,
  additionalInfo: [Schema.Types.Mixed],

  age: String,
  gender: String,

  otp: String,
  otpExpiry: Date,

  // Link-based password reset. We store only the SHA-256 hash of the token; the
  // raw token lives solely in the emailed reset link and expires after 1 hour.
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  /* -------- NOTIFICATIONS -------- */
  notifications: {
    email: {
      newMessage: { type: Boolean, default: true },
      backgroundCheck: { type: Boolean, default: true },
      safetyNoti: { type: Boolean, default: true },
      newRecoLists: { type: Boolean, default: true },
      tipsAndTricks: { type: Boolean, default: true },
      ref: { type: Boolean, default: true },
      disAccInfo: { type: Boolean, default: true },
      newSubInArea: { type: Boolean, default: true },
    },
    sms: {
      type: Boolean,
      default: false,
    },
  },

  /* -------- SUBSCRIPTION -------- */
  stripeId: String,
  subscriptionId: String,
  subscriptionStatus: String,
  premium: {
    type: Boolean,
    default: false,
  },

  status: {
    type: Schema.Types.String,
    enum: ["Active", "Block"],
    default: "Active",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  aboutMe: String,
  reviews: [reviewSchema],

  /* ===================================================== */
  /* 🔥 NEW ADDITIONS (SAFE + NON-BREAKING) */
  /* ===================================================== */

  onboarding: {
    completed: {
      type: Boolean,
      default: false,
    },
    step: {
      type: Number,
      default: 0,
    },
    intent: {
      type: String,
      enum: ["already_with_family", "looking_for_job"],
    },
  },

  nannyProfileCompleted: {
    type: Boolean,
    default: false,
  },

  // Timestamp of the one-time "complete your profile" reminder email.
  // Set by the cron job in Services/cron/completeProfileReminder.js so a user
  // is reminded at most once.
  profileReminderSentAt: {
    type: Date,
    default: null,
  },

  // Most recent time we saw this user active — set on login and on token
  // refresh (Routes/Auth.js). A refresh only succeeds within the 7-day refresh
  // window, so this stays fresh for anyone actually using the app and only goes
  // stale once they've genuinely stopped visiting. Powers the re-engagement
  // email (Services/cron/reengagementReminder.js). Null until the first login
  // after this field shipped, so the backlog isn't emailed on deploy.
  lastLogin: {
    type: Date,
    default: null,
  },

  // Timestamp of the last re-engagement ("we miss you") email we sent. Guards
  // against re-nudging the same inactive user every day: they become eligible
  // again only after they log in (which pushes lastLogin past this). Set by the
  // re-engagement cron.
  reengagementSentAt: {
    type: Date,
    default: null,
  },

  matchRequestsSent: {
    type: Number,
    default: 0,
  },

  shareSetupCompleted: {
    type: Boolean,
    default: false,
  },

  /* -------- REFERRALS -------- */
  // Caregivers (Nanny + hasFamily === false) don't pay to keep matching — they
  // refer a friend instead. Each friend who signs up with their code AND
  // completes their profile grants one month of matching, so referring someone
  // monthly keeps them permanently free.
  // See Services/utils/referral.js for the credit + expiry rules.

  // This user's own share code, e.g. "FAM7K2QX". Assigned on registration;
  // `sparse` so the pre-existing users without one don't collide on null.
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Who referred this user, resolved from the code they signed up with.
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },

  // When this user's signup actually paid out to their referrer. The reward
  // lands on profile completion, not registration, so a throwaway email alone
  // earns nothing. Null while the referral is still pending.
  //
  // This is also the idempotency guard: profile completion runs through an
  // upsert that a user can trigger repeatedly, so the credit is claimed by
  // atomically setting this field and only pays out if that claim wins.
  referralCreditedAt: {
    type: Date,
    default: null,
  },

  // How many friends have signed up with this user's code. Lifetime count —
  // shown in the UI, never decremented.
  referralCount: {
    type: Number,
    default: 0,
  },

  // Free matching runs until this moment. Each referral pushes it a calendar
  // month further out (stacking from the current expiry when still active, from
  // now when lapsed). Null means the user has never earned a month.
  referralMatchingUntil: {
    type: Date,
    default: null,
  },
});

/* ---------------- INDEX ---------------- */
userSchema.index({ location: "2dsphere" });

/* ---------------- MODEL ---------------- */
const User = mongoose.model("users", userSchema);

export default User;