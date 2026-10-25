import mongoose from "mongoose";
import Review from "../models/Review.js";
import Feedback from "../models/Feedback.js";
import Movie from "../models/movieModel.js";

/**
 * Create or update a user's rating and feedback for a movie
 * POST /api/reviews (Protected)
 */
export const createOrUpdateReview = async (req, res) => {
    try {
        const { movieId, rating, comment } = req.body || {};

        if (!movieId) {
            return res.status(400).json({ message: "Movie ID is required." });
        }

        // Validate movie ID
        if (!mongoose.isValidObjectId(movieId)) {
            return res.status(400).json({ message: "Invalid movie ID format." });
        }

        const movieExists = await Movie.findById(movieId).lean();
        if (!movieExists) {
            return res.status(404).json({ message: "Movie not found." });
        }

        const numRating = Number(rating);
        if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ message: "Rating must be an integer between 1 and 5." });
        }

        if (!comment || typeof comment !== "string" || !comment.trim()) {
            return res.status(400).json({ message: "Feedback comment is required." });
        }

        if (!req.user?._id) {
            return res.status(401).json({ message: "Please sign in to submit a review." });
        }

        const userName = req.user.username || req.user.name || "Moviegoer";

        // Upsert review for this user and movie
        const review = await Review.findOneAndUpdate(
            { movie: movieId, user: req.user._id },
            {
                $set: {
                    userName,
                    rating: Math.round(numRating),
                    comment: comment.trim()
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        ).populate("user", "username email");

        return res.status(200).json({
            success: true,
            message: "Review submitted successfully!",
            review
        });
    } catch (error) {
        console.error("Error submitting movie review:", error);
        return res.status(500).json({ message: error.message || "Failed to submit review." });
    }
};

/**
 * Fetch all reviews for a specific movie, computing averageRating and totalReviews
 * GET /api/movies/:movieId/reviews
 */
export const getMovieReviews = async (req, res) => {
    try {
        const { movieId } = req.params;

        if (!mongoose.isValidObjectId(movieId)) {
            return res.status(400).json({ message: "Invalid movie ID." });
        }

        const reviews = await Review.find({ movie: movieId })
            .sort({ createdAt: -1 })
            .populate("user", "username")
            .lean();

        const totalReviews = reviews.length;
        const totalRatingSum = reviews.reduce((sum, item) => sum + (item.rating || 0), 0);
        const averageRating =
            totalReviews > 0 ? Number((totalRatingSum / totalReviews).toFixed(1)) : 0;

        return res.status(200).json({
            success: true,
            movieId,
            totalReviews,
            averageRating,
            reviews
        });
    } catch (error) {
        console.error("Error retrieving movie reviews:", error);
        return res.status(500).json({ message: "Could not retrieve reviews." });
    }
};

/**
 * Submit general platform feedback (from Header User Dropdown)
 * POST /api/feedback
 */
export const submitGeneralFeedback = async (req, res) => {
    try {
        const { rating, feedback } = req.body || {};

        const numRating = Number(rating);
        if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ message: "Please select a rating between 1 and 5 stars." });
        }

        if (!feedback || typeof feedback !== "string" || !feedback.trim()) {
            return res.status(400).json({ message: "Feedback text is required." });
        }

        const userId = req.user?._id || null;
        const userName = req.user?.username || req.user?.name || "Anonymous";
        const userEmail = req.user?.email || "";

        const savedFeedback = await Feedback.create({
            user: userId,
            userName,
            userEmail,
            rating: Math.round(numRating),
            feedback: feedback.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Thank you for your feedback! We appreciate your input.",
            feedback: savedFeedback
        });
    } catch (error) {
        console.error("Error saving general feedback:", error);
        return res.status(500).json({ message: "Could not submit feedback. Please try again." });
    }
};
