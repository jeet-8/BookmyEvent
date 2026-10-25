import express from "express";
import { getBookings } from "../controllers/bookingController.js";
import { getAdminDashboard, getAdminUsers, loginAdmin } from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/adminAuth.js";
import { postAdminAiChat } from "../controllers/adminAiController.js";
import {
    createMovie,
    deleteMovie,
    getMovies,
    updateMovie
} from "../controllers/movieController.js";
import {
    createAdminCoupon,
    deleteAdminCoupon,
    getAdminCoupons,
    updateAdminCoupon
} from "../controllers/couponController.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/dashboard", protectAdmin, getAdminDashboard);
router.post("/ai-chat", protectAdmin, postAdminAiChat);
router.get("/users", protectAdmin, getAdminUsers);
router.get("/bookings", protectAdmin, getBookings);
router.get("/movies", protectAdmin, getMovies);
router.post("/movies", protectAdmin, createMovie);
router.put("/movies/:id", protectAdmin, updateMovie);
router.delete("/movies/:id", protectAdmin, deleteMovie);

// Admin Coupon Management routes
router.get("/coupons", protectAdmin, getAdminCoupons);
router.post("/coupons", protectAdmin, createAdminCoupon);
router.put("/coupons/:id", protectAdmin, updateAdminCoupon);
router.delete("/coupons/:id", protectAdmin, deleteAdminCoupon);

export default router;
