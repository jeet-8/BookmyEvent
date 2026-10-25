import express from "express";
import {
    createOrUpdateReview,
    getMovieReviews,
    submitGeneralFeedback
} from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

// Optional protect middleware for general feedback (attaches user if token is provided)
const optionalProtect = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (authorization?.startsWith("Bearer ")) {
        try {
            const token = authorization.slice("Bearer ".length);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");
            if (user) req.user = user;
        } catch {
            // Ignore invalid token on optional route
        }
    }
    return next();
};

const router = express.Router();

// Movie-specific review routes
router.post("/reviews", protect, createOrUpdateReview);
router.get("/movies/:movieId/reviews", getMovieReviews);

// General platform feedback route
router.post("/feedback", optionalProtect, submitGeneralFeedback);

export default router;
