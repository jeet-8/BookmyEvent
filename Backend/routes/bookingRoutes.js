import express from "express";
import {
    createBooking,
    deleteBooking,
    downloadTicketPdf,
    getBookedSeats,
    getBookingById,
    getBookings,
    updateBooking,
    updateBookingStatus
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";
import { protectAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Real-time seat availability check for shows (Public)
router.get("/booked-seats", getBookedSeats);

// Download generated ticket PDF
router.get("/:id/pdf", downloadTicketPdf);

// User booking creation
router.post("/", protect, createBooking);

// Admin booking routes
router.get("/", protectAdmin, getBookings);
router.get("/:id", protectAdmin, getBookingById);
router.put("/:id", protectAdmin, updateBooking);
router.patch("/:id/status", protectAdmin, updateBookingStatus);
router.delete("/:id", protectAdmin, deleteBooking);

export default router;
