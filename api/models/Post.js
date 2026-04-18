const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
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
        /**
         * photo — The full Cloudinary secure URL (https://res.cloudinary.com/...)
         * This URL works on any machine without local files.
         */
        photo: {
            type: String,
            required: false,
        },
        /**
         * photoPublicId — The Cloudinary public_id (e.g. "react-blog/posts/1234-cover")
         * Stored so we can call cloudinary.uploader.destroy() when the post is deleted.
         */
        photoPublicId: {
            type: String,
            required: false,
            default: null,
        },
        username: {
            type: String,
            required: true,
        },
        categories: {
            type: Array,
            required: false,
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },
        rejectionReason: {
            type: String,
            default: "",
        },
        flagged: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);