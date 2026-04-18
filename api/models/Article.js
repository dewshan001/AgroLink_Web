const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        symptoms: {
            type: [String],
            required: true,
        },
        preventionMethods: {
            type: [String],
            required: true,
        },
        treatmentPlan: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: false,
        },
        diseaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Disease",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Article", ArticleSchema);
