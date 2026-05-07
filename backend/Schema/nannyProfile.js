import mongoose from "mongoose";
const { Schema } = mongoose;

const nannyProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    unique: true,
  },

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

  /* -------- SHARE COMPATIBILITY -------- */
  shareExperience: String,
  multiFamilyComfort: String,

  childrenCapacity: {
    type: String,
  },

  preferredAges: [
    {
      type: String,
    },
  ],

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

  /* -------- PROFILE -------- */
  bio: String,

  certifications: [
    {
      type: String,
    },
  ],

  customCertifications: String,
  skills: String,

  imageFile: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("nannyprofiles", nannyProfileSchema);