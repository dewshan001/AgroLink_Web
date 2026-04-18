const router = require("express").Router();
const Article = require("../models/Article");
const Disease = require("../models/Disease");
const Crop = require("../models/Crop");

// 1. GET ALL ARTICLES (With Deep Search and Population)
router.get("/", async (req, res) => {
    const qSearch = req.query.search || "";
    const qCrop = req.query.crop || "All";

    try {
        // Step 1: Fetch and fully populate ALL articles from the database
        let articles = await Article.find().populate({
            path: "diseaseId",
            populate: { path: "cropId", model: "Crop" }
        });

        // Step 2: Filter by Crop Type using JavaScript
        if (qCrop !== "All") {
            articles = articles.filter(article =>
                article.diseaseId &&
                article.diseaseId.cropId &&
                article.diseaseId.cropId.name.toLowerCase() === qCrop.toLowerCase()
            );
        }

        // Step 3: Deep Search (Checks Titles, Disease Names, and Symptoms)
        if (qSearch !== "") {
            const searchLower = qSearch.toLowerCase();
            articles = articles.filter(article => {
                const titleMatch = article.title?.toLowerCase().includes(searchLower);
                const diseaseMatch = article.diseaseId?.diseaseName?.toLowerCase().includes(searchLower);
                const symptomMatch = article.symptoms?.some(s => s.toLowerCase().includes(searchLower));

                return titleMatch || diseaseMatch || symptomMatch;
            });
        }

        res.status(200).json(articles);
    } catch (err) {
        console.error("❌ GET Knowledge Error:", err);
        res.status(500).json(err);
    }
});

module.exports = router;