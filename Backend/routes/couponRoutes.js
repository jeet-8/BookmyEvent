import express from "express";
import { applyCoupon } from "../controllers/couponController.js";

const router = express.Router();

// Verify and calculate discount for a coupon code at checkout
router.post("/apply", applyCoupon);

export default router;
