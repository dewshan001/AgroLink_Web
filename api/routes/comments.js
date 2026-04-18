const router = require("express").Router();
const Comment = require("../models/Comment");
const User = require("../models/User");
const requireDb = require("../middleware/requireDb");

router.use(requireDb);

// GET all comments for a post (top-level + replies) — enriched with profilePic
router.get("/", async (req, res) => {
  const { postId } = req.query;
  if (!postId) return res.status(400).json("postId is required");
  try {
    const comments = await Comment.find({ postId }).sort({ createdAt: 1 });
    // Attach profilePic from User for each unique commenter
    const usernames = [...new Set(comments.map((c) => c.username))];
    const users = await User.find({ username: { $in: usernames } }).select("username profilePic");
    const picMap = {};
    users.forEach((u) => { picMap[u.username] = u.profilePic || ""; });
    const enriched = comments.map((c) => ({
      ...c._doc,
      profilePic: picMap[c.username] || "",
    }));
    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// POST a new comment or reply
router.post("/", async (req, res) => {
  const { postId, username, text, parentId } = req.body;
  if (!postId || !username || !text) {
    return res.status(400).json("postId, username and text are required");
  }
  try {
    const comment = new Comment({ postId, username, text, parentId: parentId || null });
    const saved = await comment.save();
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// UPDATE a comment (only by its owner)
router.put("/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json("Comment not found");
    if (comment.username !== req.body.username) {
      return res.status(401).json("You can edit only your comment!");
    }
    if (!req.body.text || !req.body.text.trim()) {
      return res.status(400).json("Text is required");
    }
    comment.text = req.body.text.trim();
    const saved = await comment.save();
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// DELETE a comment (only by its owner)
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json("Comment not found");
    if (comment.username !== req.body.username) {
      return res.status(401).json("You can delete only your comment!");
    }
    await comment.deleteOne();
    res.status(200).json("Comment deleted");
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

module.exports = router;
