const mongoose = require("mongoose");

const KnowledgeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
        },
        desc: {
            type: String,
            required: true,
        },
        photo: {
            type: String,
            required: false,
        },
        author: {
            type: String,
            required: true,
        },
        // Used to categorize by general topic (e.g., "Pest Control", "Soil Management")
        category: {
            type: Array,
            required: false,
        },
        // Crucial for your AI integration: Links the article to a specific disease
        diseaseTag: {
            type: String,
            required: false,
        },
        // Links the article to a specific plant/crop
        cropType: {
            type: String,
            required: false,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Knowledge", KnowledgeSchema);