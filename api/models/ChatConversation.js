const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const ChatConversationSchema = new mongoose.Schema(
  {
    ownerKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      default: "New Conversation",
      trim: true,
      maxlength: 120,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ChatConversation", ChatConversationSchema);
