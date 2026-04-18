const express = require("express");
const router = express.Router();
const Question = require("../models/Question");

// POST - Create a pre-answered question for training
router.post("/training-pair", async (req, res) => {
  try {
    const { question, answer, category, username } = req.body;

    if (!question || !answer || !username) {
      return res.status(400).json({ error: "Question, answer, and username are required" });
    }

    const newQuestion = new Question({
      question,
      username,
      category: category || "General",
      chatbotConfidence: 0,
      status: "Answered",
      answers: [
        {
          username,
          answer,
          isAccepted: true
        }
      ]
    });

    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Create a new question when chatbot can't answer
router.post("/", async (req, res) => {
  try {
    const { question, username, category, chatbotConfidence } = req.body;

    // Validate required fields
    if (!question || !username) {
      return res.status(400).json({ error: "Question and username are required" });
    }

    const newQuestion = new Question({
      question,
      username,
      category: category || "General",
      chatbotConfidence: chatbotConfidence || 0,
    });

    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Fetch all questions with optional filtering
router.get("/", async (req, res) => {
  try {
    const { status, category, username } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (username) filter.username = username;

    const limit = parseInt(req.query.limit) || 100;
    const questions = await Question.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Fetch pending questions for the training dataset
router.get("/pending", async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const pendingQuestions = await Question.find({
      status: "Pending",
      usedForTraining: false,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json(pendingQuestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Fetch a single question by ID
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Add an answer to a question
router.put("/:id/answer", async (req, res) => {
  try {
    const { username, answer, isAccepted } = req.body;

    if (!username || !answer) {
      return res.status(400).json({ error: "Username and answer are required" });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          answers: {
            username,
            answer,
            isAccepted: isAccepted || false,
          },
        },
        // If this is the first accepted answer, mark status as answered
        ...(isAccepted ? { status: "Answered" } : {}),
      },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Mark question as used for training
router.put("/:id/mark-training", async (req, res) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { usedForTraining: true, status: "Answered" },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Update question status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["Pending", "Answered", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Mark answer as helpful
router.put("/:id/helpful/:answerId", async (req, res) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Remove a question
router.delete("/:id", async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndDelete(req.params.id);

    if (!deletedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Update full question
router.put("/:id", async (req, res) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
