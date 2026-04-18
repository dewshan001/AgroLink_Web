const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require('bcrypt');
const requireDb = require("../middleware/requireDb");
const { validateRegistrationInput, validateLoginInput, validatePhone } = require("../utils/validators");

router.use(requireDb);

//REGISTER
router.post("/register", async(req, res) => {
    try {
        const normalizedEmail = req.body.email ? req.body.email.toLowerCase() : "";

        // Validate input
        const validation = validateRegistrationInput({
            email: normalizedEmail,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
            phone: req.body.phone,
            name: req.body.name
        });

        if (!validation.isValid) {
            return res.status(400).json({ errors: validation.errors });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({ errors: { email: "Email already registered" } });
        }

        // Normalize phone number
        const phoneValidation = validatePhone(req.body.phone);
        const normalizedPhone = phoneValidation.formatted;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(req.body.password, salt);

        // Determine role
        let role = "user";
        if (req.body.role === "expert") {
            role = "expert";
        }

        // For experts, validate farm images
        let farmImages = [];
        if (role === "expert") {
            if (!req.body.farmImages || !Array.isArray(req.body.farmImages)) {
                return res.status(400).json({ errors: { farmImages: "Farm images are required for expert registration" } });
            }
            if (req.body.farmImages.length < 3) {
                return res.status(400).json({ errors: { farmImages: "Minimum 3 farm images required for expert verification" } });
            }
            // Convert farm images to proper format
            farmImages = req.body.farmImages.map(img => ({
                image: img,
                uploadedAt: new Date()
            }));
        }

        // Create new user
        const newUser = new User({
            username: (req.body.username || req.body.name || "").trim(),
            name: req.body.name,
            email: normalizedEmail,
            phone: normalizedPhone,
            password: hashedPass,
            role: role,
            description: role === "expert" ? (req.body.description || "") : "",
            approved: role === "expert" ? false : true,
            farmImages: farmImages,
            verificationStatus: role === "expert" ? "pending" : "approved",
            isAdmin: false
        });

        const user = await newUser.save();

        // Remove password from response
        // Avoid returning potentially large Base64 payloads (farmImages) in auth responses.
        const { password, farmImages: _farmImages, ...userWithoutPassword } = user._doc;

        // Let the client know if they need approval
        if (role === "expert") {
            return res.status(200).json({ ...userWithoutPassword, pendingApproval: true });
        }

        res.status(200).json(userWithoutPassword);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ errors: { general: "Email already exists!" } });
        }
        console.error("Register error:", err);
        res.status(500).json({ errors: { general: "Something went wrong during registration!" } });
    }
});

//LOGIN
router.post("/login", async(req, res) => {
    try {
        const normalizedEmail = req.body.email ? req.body.email.toLowerCase() : "";

        // Validate login input
        const validation = validateLoginInput({
            email: normalizedEmail,
            password: req.body.password
        });

        if (!validation.isValid) {
            return res.status(400).json({ errors: validation.errors });
        }

        // Find user by email (not username)
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ errors: { email: "Email or password is incorrect" } });
        }

        // Validate password
        const validate = await bcrypt.compare(req.body.password, user.password);
        if (!validate) {
            return res.status(400).json({ errors: { password: "Email or password is incorrect" } });
        }

        // Block rejected experts from logging in
        if (user.role === "expert" && user.verificationStatus === "rejected") {
            return res.status(403).json({ 
                errors: { general: "Your expert account was rejected. Reason: " + (user.verificationNotes || "No details provided") } 
            });
        }

        // Block unapproved experts from logging in
        if (user.role === "expert" && user.verificationStatus === "pending") {
            return res.status(403).json({ 
                errors: { general: "Your expert account is pending admin verification of your farm images. Please wait for approval before logging in." } 
            });
        }

        // Block deactivated accounts from logging in
        if (user.active === false) {
            return res.status(403).json({ 
                errors: { general: "Your account has been deactivated by an administrator. Please contact support." } 
            });
        }

        // Remove password from response
        // Avoid returning potentially large Base64 payloads (farmImages) on login.
        const { password, farmImages: _farmImages, ...others } = user._doc;
        res.status(200).json({ ...others, isAdmin: user.isAdmin, role: user.role });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ errors: { general: "Something went wrong during login!" } });
    }
});

//LOGOUT
router.post("/logout/:userId", async(req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ errors: { general: "User ID is required" } });
        }

        // Update user's lastLogout timestamp
        await User.findByIdAndUpdate(userId, { lastLogout: new Date() });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ errors: { general: "Something went wrong during logout!" } });
    }
});

//VERIFY
router.post("/verify", async (req, res) => {
    try {
        if (!req.body?.email || !req.body?.password) {
            return res.status(400).json({ errors: { general: "Email and password are required!" } });
        }
        const normalizedEmail = req.body.email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ errors: { email: "Email or password is incorrect" } });
        }

        const validate = await bcrypt.compare(req.body.password, user.password);
        if (!validate) {
            return res.status(400).json({ errors: { password: "Email or password is incorrect" } });
        }

        res.status(200).json({ verified: true, message: "Verification successful" });
    } catch (err) {
        console.error("Verify error:", err);
        res.status(500).json({ errors: { general: "Something went wrong!" } });
    }
});

module.exports = router;