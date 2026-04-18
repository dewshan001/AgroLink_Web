const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const categoryRoute = require("./routes/categories");
const commentRoute = require("./routes/comments");
const chatbotRoute = require("./routes/chatbot");
const questionRoute = require("./routes/questions");
const eventRoute = require("./routes/events");
const geocodeRoute = require("./routes/geocode");
const productRoute = require("./routes/products");
const expertImagesRoute = require("./routes/expert-images");
const adminRoute = require("./routes/admin");

const Category = require("./models/Category");
const {
  isCloudinaryConfigured,
  uploadToCloudinary,
} = require("./utils/cloudinary");

// Prevent unhandled promise rejections from crashing the server
process.on("unhandledRejection", (reason) => {
  console.error(
    "[UnhandledRejection]",
    reason instanceof Error ? reason.message : reason,
  );
});
process.on("uncaughtException", (err) => {
  console.error("[UncaughtException]", err.message);
});

const multer = require("multer");
const path = require("path");

// Increase JSON body size limit for Base64 encoded farm images (up to 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
// Serve files from api/images/ at /images
app.use("/images", express.static(path.join(__dirname, "/images")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

async function seedDefaultCategories() {
  try {
    await Promise.all(
      DEFAULT_CATEGORIES.map((name) =>
        Category.findOneAndUpdate(
          { name },
          { $setOnInsert: { name } },
          { upsert: true, returnDocument: 'after' },
        ),
      ),
    );
  } catch (err) {
    console.error("Failed to seed default categories", err);
  }
}

async function startServer() {
  // ── Startup checks ────────────────────────────────────────────────────────
  if (!process.env.MONGO_URL) {
    console.error(
      "Missing MONGO_URL. Create api/.env and set MONGO_URL to your MongoDB connection string.",
    );
    console.error(
      "Starting backend without DB (API will return 503 for DB routes).",
    );
  }

  if (!isCloudinaryConfigured()) {
    console.error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in api/.env",
    );
  }

  try {
    if (process.env.MONGO_URL) {
      await mongoose.connect(process.env.MONGO_URL, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("Connected to MongoDB");
      await seedDefaultCategories();
    }
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    console.error("Continuing without DB (API will return 503 for DB routes).");
  }

  app.listen(5000, () => {
    console.log("Backend is running.");
  });
}

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        message: "Cloudinary is not configured on the server.",
      });
    }

    const folder = req.body?.folder || "agrolink";
    const result = await uploadToCloudinary(req.file.buffer, { folder });

    return res.status(200).json({
      url: result.secure_url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      original_filename: req.file.originalname,
    });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return res.status(500).json({ message: "Image upload failed." });
  }
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/comments", commentRoute);
app.use("/api/chatbot", chatbotRoute);
app.use("/api/questions", questionRoute);
app.use("/api/events", eventRoute);
app.use("/api/geocode", geocodeRoute);
app.use("/api/products", productRoute);
app.use("/api/expert-images", expertImagesRoute);
app.use("/api/admin", adminRoute);


// ── DB health check for admin settings ──────────────────────────────────────
app.get("/api/admin/db-status", (req, res) => {
  // mongoose.connection.readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const state = mongoose.connection.readyState;
  const stateMap = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };
  res.status(200).json({
    status: stateMap[state] || "Unknown",
    connected: state === 1,
    host: mongoose.connection.host || "—",
    name: mongoose.connection.name || "—",
  });
});

startServer();
