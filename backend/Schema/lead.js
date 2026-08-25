import mongoose from "mongoose";

const { Schema } = mongoose;

const leadSchema = new Schema(
  {
    source: {
      type: String,
      enum: ["FB", "Nextdoor", "BPN", "Peanut", "Craigslist"],
      required: true,
      default: "FB",
    },

    urgency: { type: String },
    userType: { type: String },

    directLink: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: { type: String },

    zone: {
      type: String,
      enum: ["In-Zone", "Outside-Zone", "Unknown"],
      default: "Unknown",
    },

    incomingMessage: { type: String },
    leadType: {
      type: String,
      enum: ["Parent", "Caregiver", "Nanny Share", "Unknown"],
    },
    locationStatus: { type: String },
    city: { type: String },
    careArrangement: { type: String },
    potentialShareType: { type: String },
    sharePotential: { type: String },
    nannyStatus: { type: String },
    leadTemperature: {
      type: String,
      enum: ["Hot", "Warm", "Cold", "Unknown"],
      default: "Unknown",
    },
    conversionPath: { type: String },
    priorityTier: {
      type: String,
      enum: ["Tier 1", "Tier 2", "Tier 3", "Unknown"],
      default: "Unknown",
    },
    childAge: { type: String },
    contextClues: { type: String },

    processingStatus: {
      type: String,
      enum: ["processed", "needs_review"],
      default: "processed",
      index: true,
    },
    reviewReason: { type: String },
    outreachStatus: {
      type: String,
      enum: ["new", "contacted", "responded", "converted", "dead"],
      default: "new",
      index: true,
    },

    batchId: { type: String, index: true },
    rawLeadId: { type: Schema.Types.ObjectId, ref: "raw_leads" },
  },
  { timestamps: true }
);

const Lead = mongoose.model("leads", leadSchema);

export default Lead;
