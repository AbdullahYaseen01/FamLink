import mongoose from "mongoose";

const { Schema } = mongoose;

const adminOverrideSchema = new Schema({
  city: {
    type: Schema.Types.String,
    required: true,
    trim: true,
  },
  state: {
    type: Schema.Types.String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Schema.Types.Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure uniqueness across city and state
adminOverrideSchema.index({ city: 1, state: 1 }, { unique: true });

const AdminOverride = mongoose.model("adminOverrides", adminOverrideSchema);

export default AdminOverride;
