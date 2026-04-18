const router = require("express").Router();
const requireDb = require("../middleware/requireDb");
const User = require("../models/User");
const ChatbotConfig = require("../models/ChatbotConfig");

router.use(requireDb);

async function requireAdmin(req, res, next) {
  try {
    const userId = req.query.userId || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Admin userId is required" });
    }

    const user = await User.findById(userId).select("isAdmin role");
    if (!user || user.isAdmin !== true) {
      return res.status(403).json({ error: "Admin access required" });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/chatbot-settings?userId=...
router.get("/chatbot-settings", requireAdmin, async (req, res) => {
  try {
    const cfg = await ChatbotConfig.findOne().sort({ updatedAt: -1 });

    const provider = cfg?.provider || "openrouter";
    const model = cfg?.openrouterModel || "google/gemma-3-27b-it:free";
    const hasApiKey = Boolean((cfg?.openrouterApiKey || "").trim());

    return res.status(200).json({ provider, model, hasApiKey });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/chatbot-settings
router.put("/chatbot-settings", requireAdmin, async (req, res) => {
  try {
    const provider = (req.body?.provider || "openrouter").toString();
    const model = (req.body?.model || "google/gemma-3-27b-it:free").toString().trim();
    const apiKey = (req.body?.apiKey || "").toString().trim();

    if (!model) {
      return res.status(400).json({ error: "Model is required" });
    }

    if (provider !== "openrouter") {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    const existing = await ChatbotConfig.findOne().sort({ updatedAt: -1 });
    const cfg = existing || new ChatbotConfig();

    cfg.provider = provider;
    cfg.openrouterModel = model;

    // Only overwrite the key if a new one is provided.
    if (apiKey) {
      cfg.openrouterApiKey = apiKey;
    }

    await cfg.save();

    return res.status(200).json({
      provider: cfg.provider,
      model: cfg.openrouterModel,
      hasApiKey: Boolean((cfg.openrouterApiKey || "").trim()),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
