import mongoose from "mongoose";

const { Schema } = mongoose;

const rawLeadSchema = new Schema(
  {
    batchId: { type: String, index: true },
    source: { type: String, default: "FB" },
    directLink: { type: String, index: true },
    raw: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
  },
  { timestamps: true }
);

rawLeadSchema.index({ status: 1, createdAt: 1 });

const RawLead = mongoose.model("raw_leads", rawLeadSchema);

export default RawLead;
