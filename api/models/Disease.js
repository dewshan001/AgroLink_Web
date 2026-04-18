const mongoose = require("mongoose");

const DiseaseSchema = new mongoose.Schema(
    {
        diseaseName: {
            type: String,
            required: true,
        },
        aiModelLabel: {
            type: String,
            required: true,
        },
        cropId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Disease", DiseaseSchema);
