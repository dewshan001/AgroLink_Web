const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: false,
        },
        // Confidence score from chatbot (0-100) - indicates how well the bot answered
        chatbotConfidence: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        // Status of the question
        status: {
            type: String,
            enum: ["Pending", "Answered", "Rejected"],
            default: "Pending",
        },
        // Answers from expert farmers
        answers: [
            {
                username: {
                    type: String,
                    required: true,
                },
                answer: {
                    type: String,
                    required: true,
                },
                isAccepted: {
                    type: Boolean,
                    default: false,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // For training - whether this was used to improve the bot
        usedForTraining: {
            type: Boolean,
            default: false,
        },
        // Number of people who found this Q&A helpful
        helpfulCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);
