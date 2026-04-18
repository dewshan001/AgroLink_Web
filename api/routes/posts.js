const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const requireDb = require("../middleware/requireDb");
const { deleteFromCloudinary } = require("../utils/cloudinary");

const DEFAULT_CATEGORIES = [
  "Organic Farming",
  "Inorganic Farming",
  "Crop Diseases",
  "Pest Management",
  "Soil Management",
  "Weather & Climate",
  "Crop Growth",
  "Fertilizer Management",
];

router.use(requireDb);

// ── ADMIN: Get all posts for moderation ─────────────────────────────────────
router.get("/admin/all", async (req, res) => {
  try {
    const { status, search } = req.query;
    let filter = {};
    if (status && status !== "All") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    // Attach author info (profile pic, name) from User collection
    const usernames = [...new Set(posts.map((p) => p.username))];
    const users = await User.find({ username: { $in: usernames } }).select(
      "username name profilePic",
    );
    const userMap = {};
    users.forEach((u) => {
      userMap[u.username] = u;
    });

    const enriched = posts.map((p) => {
      const post = p._doc;
      const author = userMap[post.username];
      return {
        ...post,
        authorName: author?.name || post.username,
        authorPic: author?.profilePic || "",
      };
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error("[GET /posts/admin/all]", err);
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Get moderation stats ─────────────────────────────────────────────
router.get("/admin/mod-stats", async (req, res) => {
  try {
    const [total, pending, approved, rejected, flagged] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ status: "Pending" }),
      Post.countDocuments({ status: "Approved" }),
      Post.countDocuments({ status: "Rejected" }),
      Post.countDocuments({ flagged: true }),
    ]);
    res.status(200).json({ total, pending, approved, rejected, flagged });
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Approve a post ───────────────────────────────────────────────────
router.put("/admin/approve/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found!");
    post.status = "Approved";
    post.rejectionReason = "";
    post.flagged = false;
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Reject a post ───────────────────────────────────────────────────
router.put("/admin/reject/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found!");
    post.status = "Rejected";
    post.rejectionReason = req.body.reason || "";
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Flag / Unflag a post ─────────────────────────────────────────────
router.put("/admin/flag/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found!");
    post.flagged = !post.flagged;
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Delete any post ──────────────────────────────────────────────────
router.delete("/admin/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found!");

    try {
      await deleteFromCloudinary(post.photoPublicId);
    } catch (err) {
      console.error("[DELETE /posts/admin/:id] cloud cleanup failed", err);
    }

    await post.deleteOne();
    res.status(200).json("Post has been deleted.");
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

//CREATE POST
router.post("/", async (req, res) => {
  const title = req.body?.title?.trim();
  const categories = Array.isArray(req.body?.categories) ? req.body.categories.filter(Boolean) : [];
  const desc = typeof req.body?.desc === "string" ? req.body.desc : "";
  const storyText = desc
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) {
    return res.status(400).json({ message: "Title is required." });
  }

  if (!categories.length) {
    return res.status(400).json({ message: "Category is required." });
  }

  if (!storyText) {
    return res.status(400).json({ message: "Story content is required." });
  }

  req.body.title = title;
  req.body.categories = categories;
  req.body.status = "Pending";

  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE POST
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found!");
    if (post.username === req.body.username) {
      if (typeof req.body.title === "string") {
        const trimmedTitle = req.body.title.trim();
        if (!trimmedTitle) {
          return res.status(400).json({ message: "Title cannot be empty." });
        }
        req.body.title = trimmedTitle;
      }

      if (typeof req.body.desc === "string") {
        const storyText = req.body.desc
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!storyText) {
          return res.status(400).json({ message: "Story cannot be empty." });
        }
      }

      const isReplacingPhoto =
        typeof req.body.photoPublicId === "string"
        && req.body.photoPublicId
        && req.body.photoPublicId !== post.photoPublicId;

      if (isReplacingPhoto && post.photoPublicId) {
        try {
          await deleteFromCloudinary(post.photoPublicId);
        } catch (err) {
          console.error("[PUT /posts/:id] old cloud image cleanup failed", err);
        }
      }

      try {
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $set: req.body,
          },
          { new: true },
        );
        res.status(200).json(updatedPost);
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can update only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE POST
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json("Post not found");

    // compare usernames safely
    if (
      post.username.trim().toLowerCase() ===
      req.body.username.trim().toLowerCase()
    ) {
      try {
        await deleteFromCloudinary(post.photoPublicId);
      } catch (err) {
        console.error("[DELETE /posts/:id] cloud cleanup failed", err);
      }

      await post.deleteOne(); // correct delete
      return res.status(200).json("Post has been deleted...");
    } else {
      return res.status(401).json("You can delete only your post!");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  }
});

//GET POST
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL POST
router.get("/", async (req, res) => {
  const username = req.query.user;
  const catName = req.query.cat;
  try {
    let posts;
    const approvedFilter = { status: "Approved" };

    // If 'authorRequestsOwn' is true, we skip the approved filter and get ALL their posts
    const authorRequestsOwn = req.query.authorRequestsOwn === "true";

    if (username) {
      if (authorRequestsOwn) {
        // Fetch all posts (Approved, Pending, Rejected) for this author
        posts = await Post.find({ username }).sort({ createdAt: -1 });
      } else {
        // Public view: only approved posts for this author
        posts = await Post.find({ username, ...approvedFilter }).sort({ createdAt: -1 });
      }
    } else if (catName) {
      if (catName === "Other") {
        posts = await Post.find({
          ...approvedFilter,
          categories: {
            $elemMatch: { $nin: DEFAULT_CATEGORIES },
          },
        }).sort({ createdAt: -1 });
      } else {
        posts = await Post.find({
          ...approvedFilter,
          categories: {
            $in: [catName],
          },
        }).sort({ createdAt: -1 });
      }
    } else {
      posts = await Post.find(approvedFilter).sort({ createdAt: -1 });
    }

    // Attach authorPic from User collection
    const usernames = [...new Set(posts.map((p) => p.username))];
    const users = await User.find({ username: { $in: usernames } }).select("username profilePic");
    const picMap = {};
    users.forEach((u) => { picMap[u.username] = u.profilePic || ""; });
    const enriched = posts.map((p) => ({ ...p._doc, authorPic: picMap[p.username] || "" }));

    res.status(200).json(enriched);
  } catch (err) {
    console.error("GET /posts error:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
