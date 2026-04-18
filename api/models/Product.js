const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
    {
        crop_name: {
            type: String,
            required: true,
        },
        category_id: {
            type: String,
            required: true,
        },
        quantity: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        seller_id: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: "Pending",
        },
        image_url: {
            type: String,
            required: false,
        },
        phone: {
            type: String,
            required: true,
            validate: {
                validator: function(v) {
                    if (!v) return false;
                    const cleanPhone = v.toString().replace(/[-.\s]/g, "");
                    return /^\d{10}$/.test(cleanPhone);
                },
                message: props => `${props.value} is not a valid phone number! (Must be exactly 10 digits)`
            }
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
