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
  communicationPreference: { type: String }, // Chat, Email, Phone, etc.
  communicationSpecify: { type: String }, // optional
  backupCare: { type: String }, // Family, Nanny service, None, etc.
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
  numChildrenCare: String,
  agesCare: [String],
  currentSchedule: String,
  joinTiming: String,
  together: String,

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
}, { strict: false });

export default mongoose.model("nannyprofiles", nannyProfileSchema);