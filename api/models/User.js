const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        default: "",
    },
    name: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["user", "expert", "admin"],
        default: "user",
    },
    description: {
        type: String,
        default: "",
    },
    approved: {
        type: Boolean,
        default: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    farmImages: [{
        image: {
            type: String,
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        }
    }],
    verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    verificationNotes: {
        type: String,
        default: "",
    },
    lastLogout: {
        type: Date,
        default: null,
    },
},
{ timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);