import express from "express";
import { protect } from "../middleware/auth.js";
import { loginUser, registerUser, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);

router.get("/me", protect, (req, res) => {
    return res.status(200).json(req.user);
});

export default router;
