import mongoose from "mongoose";

const { Schema } = mongoose;

const launchRequestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
    },
    neighborhood: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    tract_geoid: {
      type: String,
      required: false,
      trim: true,
    },
    zipCode: {
      type: String,
      required: false,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["Family", "Nanny"],
      required: true,
    },
  },
  { timestamps: true }
);

const LaunchRequest = mongoose.model("launchrequests", launchRequestSchema);

export default LaunchRequest;
