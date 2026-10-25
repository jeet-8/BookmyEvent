import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        userName: {
            type: String,
            default: "Anonymous",
            trim: true
        },
        userEmail: {
            type: String,
            trim: true,
            default: ""
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"]
        },
        feedback: {
            type: String,
            required: [true, "Feedback message is required"],
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);

export default Feedback;
