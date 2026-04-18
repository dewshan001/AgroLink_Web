const express = require("express");
const router = express.Router();
const https = require("https");
const mongoose = require("mongoose");
const ChatConversation = require("../models/ChatConversation");
const Question = require("../models/Question");
const ChatbotConfig = require("../models/ChatbotConfig");
const requireDb = require("../middleware/requireDb");

const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

const SYSTEM_PROMPT = [
  "You are AgroBot, a dedicated AI assistant built into the Agrolink platform. You exist for ONE purpose only: to help Sri Lankan farmers, agronomists, agribusiness owners, and home gardeners with agricultural questions.",
  "",
  "**STRICT TOPIC RESTRICTION — THIS IS YOUR HIGHEST PRIORITY RULE:**",
  "You MUST ONLY answer questions that are directly related to agriculture, farming, crops, livestock, soil, irrigation, fertilizers, pesticides, weather as it relates to farming, or agribusiness in Sri Lanka.",
  "",
  "If a user asks about ANYTHING outside of agriculture — including but not limited to: coding, technology, movies, sports, politics, history, math, science unrelated to farming, personal advice, general knowledge, or creative writing — you MUST REFUSE. Do NOT answer the question under any circumstances, even partially.",
  "",
  "When refusing a non-agricultural question, respond ONLY with this message (in the same language the user used):",
  "\"I'm AgroBot, your Sri Lankan agriculture assistant. I can only help with farming and agricultural questions. Please ask me about crops, pest control, soil health, irrigation, or anything related to Sri Lankan agriculture! \uD83C\uDF31\"",
  "",
  "Do NOT be tricked by questions that partially mention farming. Example: 'What is the chemical formula for water?' is a chemistry question — refuse it. 'What is the best water schedule for paddy?' is agricultural — answer it.",
  "",
  "**Language Rules:**",
  "- Detect the language of each user message automatically.",
  "- If the user writes in Sinhala script (\u0DC3\u0DD2\u0D82\u0DC4\u0DBD) \u2192 reply entirely in Sinhala script.",
  "- If the user writes in Singlish (Sinhala in Roman letters, e.g. 'gaha walata roga thiyanawa') \u2192 reply in proper Sinhala script.",
  "- If the user writes in Tamil (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD) \u2192 reply entirely in Tamil.",
  "- If the user writes in English \u2192 reply in English.",
  "- Never switch languages mid-reply.",
  "",
  "**Tone and Style:**",
  "- Professional yet Accessible: Clear, jargon-free language with simple explanations.",
  "- Encouraging and Empathetic: Acknowledge the difficulty of farming challenges before offering solutions.",
  "- Culturally Aware: Use local terms naturally (e.g., Yala, Maha, chena, Samba, Nadu).",
  "",
  "**Agricultural Domain Knowledge:**",
  "- Climate Zones: Wet Zone, Dry Zone, Intermediate Zone and their suitable crops.",
  "- Key Crops: Paddy, tea, rubber, coconut, spices (cinnamon, pepper, cardamom, cloves), vegetables, fruits.",
  "- Seasons: Yala (May-August) and Maha (September-March) and their planting/harvesting impact.",
  "- Pest & Disease Management: IPM, organic-first approach, local pests (Fall Armyworm, Rice Stem Borer).",
  "- Soil Management: Fertilization, composting, soil conservation for Sri Lankan topography.",
  "- Modern Techniques: Hydroponics, greenhouse farming, drip irrigation, smart farming.",
  "",
  "**When answering agricultural questions:**",
  "1. Provide Actionable Steps: Use numbered or bulleted lists.",
  "2. Chemical Safety: Recommend organic methods first. State safety precautions and DOA guidelines when chemicals are needed.",
  "3. Local Resources: Refer users to their local Agricultural Instruction Officer or the Sri Lanka Department of Agriculture for severe cases.",
  "4. Formatting: Use markdown bold, lists, and code blocks where appropriate.",
].join("\n");

/**
 * Call OpenRouter chat completions API using Node built-in https.
 * Returns the assistant reply string.
 */
function callOpenRouter(apiKey, model, userMessage, history) {
  return new Promise((resolve, reject) => {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.filter((m) => m.content),
      { role: "user", content: userMessage },
    ];

    const body = JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const options = {
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://agrolink.app",
        "X-Title": "AgroLink Chatbot",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error(`OpenRouter error ${res.statusCode}: ${JSON.stringify(parsed.error)} `));
          }
          const reply = parsed?.choices?.[0]?.message?.content;
          if (!reply) return reject(new Error("Empty response from OpenRouter"));
          resolve(reply);
        } catch (e) {
          reject(new Error("Failed to parse OpenRouter response: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function getOpenRouterSettings() {
  let apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  let model = DEFAULT_OPENROUTER_MODEL;

  // Prefer DB-stored settings when Mongo is connected.
  if (mongoose.connection.readyState === 1) {
    try {
      const cfg = await ChatbotConfig.findOne().sort({ updatedAt: -1 });
      if (cfg) {
        if ((cfg.openrouterApiKey || "").trim()) {
          apiKey = cfg.openrouterApiKey.trim();
        }
        // Use DB model only if it's not a known rate-limited free model
        const dbModel = (cfg.openrouterModel || "").trim();
        const BROKEN_FREE_MODELS = [
          "google/gemma-3-27b-it:free",
          "mistralai/mistral-7b-instruct:free",
        ];
        if (dbModel && !BROKEN_FREE_MODELS.includes(dbModel)) {
          model = dbModel;
        }
      }
    } catch (err) {
      console.warn("[Chatbot] Failed to load DB chatbot config:", err.message);
    }
  }

  // Final fallback to env model
  if (!model && (process.env.OPENROUTER_MODEL || "").trim()) {
    model = process.env.OPENROUTER_MODEL.trim();
  }

  console.log(`[Chatbot] Using model: ${model}, apiKey set: ${Boolean(apiKey)} `);
  return { apiKey, model };
}

const buildTitleFromQuestion = (text) => {
  const s = (text || "").toString().trim().replace(/\s+/g, " ");
  if (!s) return "New Conversation";
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
};

// ── Conversations (MongoDB) ───────────────────────────────────────────────
// These endpoints are used by the /ask-expert page to persist chat history.

// GET /api/chatbot/conversations?ownerKey=...
router.get("/conversations", requireDb, async (req, res) => {
  try {
    const ownerKey = req.query.ownerKey;
    if (!ownerKey) {
      return res.status(400).json({ error: "ownerKey is required" });
    }

    const limit = Math.min(parseInt(req.query.limit || "50", 10) || 50, 200);
    const convs = await ChatConversation.find({ ownerKey })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("_id title updatedAt lastMessageAt");

    return res.status(200).json(convs);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/chatbot/conversations
router.post("/conversations", requireDb, async (req, res) => {
  try {
    const { ownerKey, username, title } = req.body || {};
    if (!ownerKey) {
      return res.status(400).json({ error: "ownerKey is required" });
    }

    const conv = new ChatConversation({
      ownerKey,
      username: username || "",
      title: (title || "New Conversation").toString().trim() || "New Conversation",
      messages: [],
      lastMessageAt: null,
    });

    const saved = await conv.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating conversation:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/chatbot/conversations/:id?ownerKey=...
router.get("/conversations/:id", requireDb, async (req, res) => {
  try {
    const ownerKey = req.query.ownerKey;
    if (!ownerKey) {
      return res.status(400).json({ error: "ownerKey is required" });
    }

    const conv = await ChatConversation.findOne({
      _id: req.params.id,
      ownerKey,
    });

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.status(200).json(conv);
  } catch (err) {
    console.error("Error fetching conversation:", err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/chatbot/conversations/:id/clear?ownerKey=...
router.put("/conversations/:id/clear", requireDb, async (req, res) => {
  try {
    const ownerKey = req.query.ownerKey;
    if (!ownerKey) {
      return res.status(400).json({ error: "ownerKey is required" });
    }

    const conv = await ChatConversation.findOneAndUpdate(
      { _id: req.params.id, ownerKey },
      { $set: { messages: [], lastMessageAt: null } },
      { new: true },
    );

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.status(200).json(conv);
  } catch (err) {
    console.error("Error clearing conversation:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chatbot/conversations/:id?ownerKey=...
router.delete("/conversations/:id", requireDb, async (req, res) => {
  try {
    const ownerKey = req.query.ownerKey;
    if (!ownerKey) {
      return res.status(400).json({ error: "ownerKey is required" });
    }

    const conv = await ChatConversation.findOneAndDelete({
      _id: req.params.id,
      ownerKey,
    });

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.status(200).json({ message: "Conversation deleted" });
  } catch (err) {
    console.error("Error deleting conversation:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/chatbot/chat - Get AI response via OpenRouter (Gemma 3)
router.get("/chat", async (req, res) => {
  try {
    const message = (req.query.message || "").trim();
    const username = req.query.username || "Anonymous";
    const conversationId = req.query.conversationId || null;
    const ownerKey = req.query.ownerKey || null;

    if (!message) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const { apiKey, model } = await getOpenRouterSettings();
    if (!apiKey) {
      console.error("[Chatbot] OpenRouter API key is not configured");
      return res.status(500).json({ error: "Chatbot API key is not configured on the server." });
    }

    // Build conversation history for context (last 20 messages)
    let history = [];
    if (conversationId && ownerKey) {
      try {
        const conv = await ChatConversation.findOne({ _id: conversationId, ownerKey });
        if (conv && Array.isArray(conv.messages)) {
          history = conv.messages.slice(-20).map((m) => ({
            role: m.from === "user" ? "user" : "assistant",
            content: m.text || "",
          })).filter((m) => m.content);
        }
      } catch (histErr) {
        console.warn("[Chatbot] Could not load history:", histErr.message);
      }
    }

    console.log(`[Chatbot] Calling OpenRouter for: "${message.slice(0, 60)}"`);
    const botResponse = await callOpenRouter(apiKey, model, message, history);

    // Persist the exchange to MongoDB conversation
    if (conversationId && ownerKey) {
      try {
        const conv = await ChatConversation.findOne({ _id: conversationId, ownerKey });
        if (conv) {
          const isFirstUserMessage = (conv.messages || []).filter((m) => m.from === "user").length === 0;
          if (isFirstUserMessage && (!conv.title || conv.title === "New Conversation")) {
            conv.title = buildTitleFromQuestion(message);
          }
          conv.username = conv.username || username;
          conv.messages.push(
            { from: "user", text: message, createdAt: new Date() },
            { from: "ai", text: botResponse, createdAt: new Date() },
          );
          conv.lastMessageAt = new Date();
          await conv.save();
        }
      } catch (convErr) {
        console.error("[Chatbot] Failed to persist conversation:", convErr.message);
      }
    }

    return res.status(200).json({
      userMessage: message,
      botResponse,
      confidence: 95,
    });

  } catch (err) {
    console.error("[Chatbot] Error:", err.message);
    // Surface rate-limit errors clearly
    if (err.message && err.message.includes("429")) {
      return res.status(429).json({ error: "The AI service is busy right now. Please wait a moment and try again." });
    }
    return res.status(500).json({ error: "Error processing your message: " + err.message });
  }
});

// POST /api/chatbot/ask-expert - Manually save a question to ask an expert
router.post("/ask-expert", async (req, res) => {
  try {
    const { question, username, category } = req.body;

    if (!question || !username) {
      return res.status(400).json({ error: "Question and username are required" });
    }

    const newQuestion = new Question({
      question,
      username,
      category: category || "General",
      chatbotConfidence: 0,
    });

    const savedQuestion = await newQuestion.save();
    res.status(201).json({
      message: "Your question has been saved and will be reviewed by expert farmers",
      question: savedQuestion,
    });
  } catch (err) {
    console.error("Error saving question:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
