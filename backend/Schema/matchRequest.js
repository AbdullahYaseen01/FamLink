import mongoose from "mongoose";
const { Schema } = mongoose;

const matchRequestSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },

  receiverId: {
    type: Schema.Types.ObjectId,
    ref: "users", // later: separate Family model
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "blocked"],
    default: "pending",
  },

  // Who initiated a block. Set when status becomes "blocked"; cleared on unblock.
  // Lets the chat screen show "you've blocked" to the blocker vs. a generic
  // unavailable state to the blocked party, and restricts unblocking to the blocker.
  blockedBy: {
    type: Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },

  message: String, // optional intro message

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("matchrequests", matchRequestSchema);