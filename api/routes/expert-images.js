const router = require("express").Router();
const User = require("../models/User");
const requireDb = require("../middleware/requireDb");

router.use(requireDb);

// ── EXPERT: Upload farm image to their pending verification ─────────────────
router.post("/upload", async (req, res) => {
  try {
    const { image, userId } = req.body;

    // Validate input
    if (!image || !userId) {
      return res.status(400).json({ 
        message: "Image (Base64) and userId are required" 
      });
    }

    // Validate image is Base64
    if (typeof image !== "string" || !image.startsWith("data:image")) {
      return res.status(400).json({ 
        message: "Image must be a valid Base64 string starting with 'data:image'" 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "expert") {
      return res.status(400).json({ message: "Only experts can upload farm images" });
    }

    // Only allow uploads if verification is still pending
    if (user.verificationStatus === "approved") {
      return res.status(400).json({ 
        message: "Cannot modify farm images after approval" 
      });
    }

    // Add image to farmImages array
    user.farmImages.push({
      image: image,
      uploadedAt: new Date()
    });

    await user.save();

    res.status(200).json({ 
      message: "Image uploaded successfully",
      imageCount: user.farmImages.length
    });
  } catch (err) {
    console.error("[POST /api/expert-images/upload]", err);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

// ── EXPERT: Delete farm image ───────────────────────────────────────────────
router.delete("/delete/:userId/:imageIndex", async (req, res) => {
  try {
    const { userId, imageIndex } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "expert") {
      return res.status(400).json({ message: "Only experts can delete farm images" });
    }

    // Only allow deletion if verification is still pending
    if (user.verificationStatus === "approved") {
      return res.status(400).json({ 
        message: "Cannot delete farm images after approval" 
      });
    }

    const idx = parseInt(imageIndex);
    if (isNaN(idx) || idx < 0 || idx >= user.farmImages.length) {
      return res.status(400).json({ message: "Invalid image index" });
    }

    // Check minimum 3 images if already have more
    if (user.farmImages.length <= 3) {
      return res.status(400).json({ 
        message: "Minimum 3 farm images required. Cannot delete." 
      });
    }

    user.farmImages.splice(idx, 1);
    await user.save();

    res.status(200).json({ 
      message: "Image deleted successfully",
      imageCount: user.farmImages.length
    });
  } catch (err) {
    console.error("[DELETE /api/expert-images/delete]", err);
    res.status(500).json({ message: "Failed to delete image" });
  }
});

// ── ADMIN: Get pending experts with farm images for verification ────────────
router.get("/admin/pending", async (req, res) => {
  try {
    const pendingExperts = await User.find({
      role: "expert",
      verificationStatus: "pending"
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(pendingExperts);
  } catch (err) {
    console.error("[GET /api/expert-images/admin/pending]", err);
    res.status(500).json({ message: "Failed to fetch pending experts" });
  }
});

// ── ADMIN: Get specific expert's farm images ────────────────────────────────
router.get("/admin/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "Expert not found" });
    }

    if (user.role !== "expert") {
      return res.status(400).json({ message: "User is not an expert" });
    }

    // Return expert info with farm images
    const { password, ...expertData } = user._doc;
    res.status(200).json(expertData);
  } catch (err) {
    console.error("[GET /api/expert-images/admin/:userId]", err);
    res.status(500).json({ message: "Failed to fetch expert images" });
  }
});

module.exports = router;
