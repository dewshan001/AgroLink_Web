const router = require("express").Router();
const Product = require("../models/Product");
const User = require("../models/User");

// CREATE PRODUCT
router.post("/", async (req, res) => {
    const newProduct = new Product(req.body);
    try {
        const savedProduct = await newProduct.save();
        res.status(200).json(savedProduct);
    } catch (err) {
        console.error("POST /products error:", err);
        res.status(500).json(err);
    }
});

// GET ALL PRODUCTS
router.get("/", async (req, res) => {
    const qCategory = req.query.category;
    try {
        let products;
        if (qCategory) {
            products = await Product.find({ category_id: qCategory });
        } else {
            products = await Product.find();
        }
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET PRODUCT
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json(err);
    }
});

// UPDATE PRODUCT
router.put("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        let isAdmin = false;
        if (req.body.userId) {
            const user = await User.findById(req.body.userId);
            if (user && user.isAdmin) {
                isAdmin = true;
            }
        }

        if (product.seller_id === req.body.username || isAdmin) {
            try {
                const updatedProduct = await Product.findByIdAndUpdate(
                    req.params.id,
                    {
                        $set: req.body,
                    },
                    { new: true }
                );
                res.status(200).json(updatedProduct);
            } catch (err) {
                res.status(500).json(err);
            }
        } else {
            res.status(401).json("You can update only your products!");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// DELETE PRODUCT
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        let isAdmin = false;
        if (req.body.userId) {
            const user = await User.findById(req.body.userId);
            if (user && user.isAdmin) {
                isAdmin = true;
            }
        }

        if (product.seller_id === req.body.username || isAdmin) {
            try {
                await product.deleteOne();
                res.status(200).json("Product has been deleted...");
            } catch (err) {
                res.status(500).json(err);
            }
        } else {
            res.status(401).json("You can delete only your products!");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
