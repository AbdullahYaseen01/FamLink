import mongoose from "mongoose";
const { Schema } = mongoose;

const nannyProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    unique: true,
  },

  /* -------- SHARE COMPATIBILITY -------- */
  shareExperience: Boolean,
  multiFamilyComfort: Boolean,

  childrenCapacity: {
    type: String,
    enum: ["1-2", "2-3", "3-4", "flexible"],
  },

  preferredAges: [
    {
      type: String,
      enum: ["infant", "toddler", "preschool", "school-age"],
    },
  ],

  workSetup: {
    type: String,
    enum: ["one_home", "rotating", "either"],
  },

  /* -------- AVAILABILITY -------- */
  availability: [
    {
      day: String, // "Monday"
      startTime: String, // "09:00"
      endTime: String, // "17:00"
    },
  ],

  startAvailability: {
    type: String,
    enum: ["immediate", "2_weeks", "1_month", "flexible"],
  },

  /* -------- ROLE & EXPECTATIONS -------- */
  responsibilities: [
    {
      type: String,
      enum: [
        "childcare",
        "meal_prep",
        "education",
        "outdoor",
        "transport",
        "homework",
        "sleep_routine",
      ],
    },
  ],

  householdHelp: {
    type: String,
    enum: ["full", "child_only", "none"],
  },

  /* -------- TRUST -------- */
  hasTransport: Boolean,
  backgroundCheck: Boolean,

  /* -------- PAY -------- */
  hourlyRate: {
    min: Number,
    max: Number,
  },

  /* -------- PROFILE -------- */
  bio: String,

  certifications: [
    {
      type: String,
      enum: ["cpr", "first_aid", "ece", "trustline", "other"],
    },
  ],

  customCertifications: [String],
  skills: [String],

  photo: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("nannyprofiles", nannyProfileSchema);