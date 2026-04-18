const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const requireDb = require("../middleware/requireDb");


router.use(requireDb);

// ── ADMIN: Get all users ────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Get dashboard stats ──────────────────────────────────────────────
router.get("/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();

    // Users created in last 30 days vs previous 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const usersThisMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const usersLastMonth = await User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });
    const postsThisMonth = await Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const postsLastMonth = await Post.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const pct = Math.round(((current - previous) / previous) * 100);
      return (pct >= 0 ? "+" : "") + pct + "%";
    };

    res.status(200).json({
      totalUsers,
      totalPosts,
      userChange: calcChange(usersThisMonth, usersLastMonth),
      postChange: calcChange(postsThisMonth, postsLastMonth),
    });
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Get pending expert approvals ─────────────────────────────────────
router.get("/admin/pending-experts", async (req, res) => {
  try {
    const pendingExperts = await User.find({ 
      role: "expert", 
      verificationStatus: { $in: ["pending", "rejected"] }
    })
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json(pendingExperts);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Get pending experts with farm images (detailed view) ──────────────
router.get("/admin/pending-experts-with-images", async (req, res) => {
  try {
    const pendingExperts = await User.find({ 
      role: "expert", 
      verificationStatus: "pending"
    })
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json(pendingExperts);
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Approve expert ───────────────────────────────────────────────────
router.put("/admin/approve/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found!");
    if (user.role !== "expert") return res.status(400).json("User is not an expert!");
    
    user.approved = true;
    user.verificationStatus = "approved";
    if (req.body.verificationNotes) {
      user.verificationNotes = req.body.verificationNotes;
    }
    
    await user.save();
    res.status(200).json("Expert has been approved!");
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Reject expert (keep account, mark as rejected) ────────────────────
router.put("/admin/reject/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found!");
    if (user.role !== "expert") return res.status(400).json("User is not an expert!");
    
    user.approved = false;
    user.verificationStatus = "rejected";
    user.verificationNotes = req.body.verificationNotes || "Farm image verification failed. Please reapply.";
    
    await user.save();
    res.status(200).json("Expert has been rejected!");
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Deactivate user account ──────────────────────────────────────────
router.put("/admin/deactivate/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found!");
    if (user.isAdmin) return res.status(400).json("Cannot deactivate an admin account!");
    user.active = false;
    await user.save();
    res.status(200).json("User account has been deactivated!");
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Reactivate user account ──────────────────────────────────────────
router.put("/admin/reactivate/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found!");
    user.active = true;
    await user.save();
    res.status(200).json("User account has been reactivated!");
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Create admin account ─────────────────────────────────────────────
router.post("/admin/create-admin", async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json("Username, email and password are required!");
    }
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json("Username or email already exists!");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);
    const newAdmin = new User({
      username,
      name: name || username,
      email,
      password: hashedPass,
      role: "admin",
      isAdmin: true,
      approved: true,
      active: true,
    });
    const savedUser = await newAdmin.save();
    const { password: pw, ...others } = savedUser._doc;
    res.status(201).json(others);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json("Username or email already exists!");
    }
    res.status(500).json("Something went wrong!");
  }
});

// ── ADMIN: Delete any user ──────────────────────────────────────────────────
router.delete("/admin/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found!");
    await Post.deleteMany({ username: user.username });
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted...");
  } catch (err) {
    res.status(500).json("Something went wrong!");
  }
});

//UPDATE
router.put("/:id", async(req, res) => {
   if(req.body.userId === req.params.id){
        if(req.body.password){
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }
        try{
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id, 
                {
                    $set:req.body,
                },
                {new:true}
            );
            res.status(200).json(updatedUser);
        }catch(err){
            if (err.code === 11000) {
                return res.status(400).json("Username or email already exists!");
            }
            res.status(500).json("Something went wrong!");
        }
    }else{
        res.status(401).json("You can update only your account!");
    }
});


//DELETE
router.delete("/:id", async(req, res) => {
   if(req.body.userId === req.params.id){
    try{
        const user = await User.findById(req.params.id);
        try{
            await Post.deleteMany({username: user.username});
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json("User has been deleted...");
        }catch(err){
            res.status(500).json("Something went wrong!");
        }
    }catch(err){
        res.status(500).json("Something went wrong!");
    }
    }else{
        res.status(401).json("You can delete only your account!");
    }
});

// ── Account status check (for active sessions) ─────────────────────────────
router.get("/check/status/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ exists: false, active: false });
        }
        return res.status(200).json({ exists: true, active: user.active !== false });
    } catch (err) {
        res.status(500).json("Something went wrong!");
    }
});

//GET USER
router.get("/:id", async (req,res)=>{
    try{
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found!");
        const {password, ...others} = user._doc;
        res.status(200).json(others);
    }catch(err){
        res.status(500).json("Something went wrong!");
    }
})

module.exports = router;

