import mongoose from "mongoose";

const { Schema } = mongoose;

const leadSchema = new Schema({
  source: {
    type: Schema.Types.String,
    enum: ["FB", "Nextdoor", "BPN", "Peanut", "Craigslist"],
    required: true,
  },
  
  urgency: {
    type: Schema.Types.String,
    enum: ["High", "Medium", "Low"],
    required: true,
  },

  userType: {
    type: Schema.Types.String,
    enum: ["Infant", "After-School/Camp", "Weekend/Date Night", "Caregiver"],
    required: true,
  },

  directLink: {
    type: Schema.Types.String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Lead = mongoose.model("leads", leadSchema);

export default Lead;
