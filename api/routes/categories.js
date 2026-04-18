const router = require("express").Router();
const Category = require("../models/Category");
const requireDb = require("../middleware/requireDb");

router.use(requireDb);

router.post("/", async (req, res) =>{
    const name = (req.body?.name || "").trim();
    if(!name) return res.status(400).json("Category name is required");

    try{
        const cat = await Category.findOneAndUpdate(
            { name },
            { $setOnInsert: { name } },
            { new: true, upsert: true }
        );
        return res.status(200).json(cat);
    }catch(err){
        // If unique index races, fall back to returning the existing doc
        if (err?.code === 11000) {
            try {
                const existing = await Category.findOne({ name });
                if (existing) return res.status(200).json(existing);
            } catch (e) {}
        }
        return res.status(500).json("Something went wrong!");
    }
});


router.get("/", async (req, res) =>{
    try{
        const cats = await Category.find().sort({ name: 1 });
        res.status(200).json(cats);
    }catch(err){
        res.status(500).json("Something went wrong!");
    }
});

module.exports = router;