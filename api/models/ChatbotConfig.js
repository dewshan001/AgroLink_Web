const mongoose = require("mongoose");

const ChatbotConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["openrouter"],
      default: "openrouter",
    },
    openrouterApiKey: {
      type: String,
      default: "",
    },
    openrouterModel: {
      type: String,
      default: "google/gemini-2.0-flash-001",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ChatbotConfig", ChatbotConfigSchema);
