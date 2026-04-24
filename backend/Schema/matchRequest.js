import mongoose from "mongoose";
const { Schema } = mongoose;

const matchRequestSchema = new Schema({
  nannyId: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },

  familyId: {
    type: Schema.Types.ObjectId,
    ref: "users", // later: separate Family model
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  message: String, // optional intro message

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("matchrequests", matchRequestSchema);