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

  shareSetupCompleted: {
    type: Boolean,
    default: false,
  },
});

/* ---------------- INDEX ---------------- */
userSchema.index({ location: "2dsphere" });

/* ---------------- MODEL ---------------- */
const User = mongoose.model("users", userSchema);

export default User;