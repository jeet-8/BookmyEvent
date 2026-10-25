import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        movie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movie",
            required: [true, "Movie reference is required"]
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"]
        },
        userName: {
            type: String,
            required: [true, "User name is required"],
            trim: true
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"]
        },
        comment: {
            type: String,
            required: [true, "Feedback comment is required"],
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Ensure a user has at most one review per movie (upsert pattern)
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
