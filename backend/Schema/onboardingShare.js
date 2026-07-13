import mongoose from "mongoose";
const { Schema } = mongoose;

const onboardingSchema = new Schema({
  email: String, // optional until signup

  name: String,

  intent: {
    type: String,
    enum: ["already_with_family", "looking_for_job"],
  },

  // ONLY for "looking_for_job"
  experience: {
    type: String,
    enum: ["0-1", "1-3", "3-5", "5+"],
  },

  schedulePreference: {
    type: String,
    enum: ["full-time", "part-time", "flexible"],
  },

  location: {
    city: String,
    neighborhood: String,
    coordinates: {
      type: [Number], // [lng, lat]
    },
  },

  travelRadius: {
    type: String,
    enum: ["1-3", "3-5", "5-10", "flexible"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("onboarding", onboardingSchema);