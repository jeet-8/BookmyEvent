import mongoose from "mongoose";
import Booking from "../models/bookingModel.js";
import Coupon from "../models/couponModel.js";
import { generateTicketPdf } from "../services/ticketPdfService.js";
import { sendTicketEmail } from "../services/emailService.js";

/**
 * Get all bookings (Admin)
 */
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "username email")
            .sort({ bookingDate: -1 })
            .lean();
        return res.status(200).json({ message: "Bookings retrieved successfully.", bookings });
    } catch (error) {
        console.error("Error retrieving bookings:", error);
        return res.status(500).json({ message: "Could not retrieve bookings." });
    }
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid booking ID." });
    }

    try {
        const booking = await Booking.findById(req.params.id)
            .populate("user", "username email")
            .lean();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        return res.status(200).json({ message: "Booking retrieved successfully.", booking });
    } catch (error) {
        console.error("Error retrieving booking:", error);
        return res.status(500).json({ message: "Could not retrieve booking." });
    }
};

/**
 * Get currently booked seats for a specific show/cinema/time.
 * Used by frontend to lock already taken seats on the seat grid.
 */
export const getBookedSeats = async (req, res) => {
    try {
        const { movieTitle, showDate, showTime, cinemaName } = req.query || {};

        if (!movieTitle) {
            return res.status(400).json({ message: "Movie title is required." });
        }

        const filter = {
            movieTitle: movieTitle.trim(),
            status: { $in: ["confirmed", "Confirmed"] }
        };

        if (showDate) filter.showDate = showDate.trim();
        if (showTime) filter.showTime = showTime.trim();
        if (cinemaName) {
            filter["cinema.name"] = { $regex: new RegExp(`^${cinemaName.trim()}$`, "i") };
        }

        const bookings = await Booking.find(filter).select("seatNumbers").lean();
        const bookedSeats = Array.from(
            new Set(bookings.flatMap((b) => b.seatNumbers || []))
        );

        return res.status(200).json({
            success: true,
            bookedSeats
        });
    } catch (error) {
        console.error("Error retrieving booked seats:", error);
        return res.status(500).json({ message: "Could not retrieve booked seats." });
    }
};

/**
 * Create a new booking with Real Seat Locking & Automatic Brevo PDF dispatch
 */
export const createBooking = async (req, res) => {
    const {
        movieTitle,
        seats,
        seatNumbers = [],
        showDate = "",
        showTime = "",
        cinema = {},
        totalPrice,
        couponCode = null,
        paymentMethod = "UPI_QR"
    } = req.body || {};

    const seatCount = Number(seats) || (Array.isArray(seatNumbers) ? seatNumbers.length : 1);
    const price = Number(totalPrice);

    if (
        typeof movieTitle !== "string" ||
        !movieTitle.trim() ||
        !Number.isInteger(seatCount) ||
        seatCount < 1 ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        return res.status(400).json({
            message: "Valid movie title, seats, and total price are required."
        });
    }

    if (!req.user?._id) {
        return res.status(401).json({ message: "Sign in before creating a booking." });
    }

    const normalizedSeats = Array.isArray(seatNumbers)
        ? seatNumbers.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
        : [];

    try {
        // 1. Real Seat Locking: Check for seat conflicts in existing confirmed bookings
        if (normalizedSeats.length > 0 && showDate && showTime) {
            const cinemaName = typeof cinema === "string" ? cinema : cinema.name || "";
            const conflictQuery = {
                movieTitle: movieTitle.trim(),
                showDate: showDate.trim(),
                showTime: showTime.trim(),
                status: { $in: ["confirmed", "Confirmed"] },
                seatNumbers: { $in: normalizedSeats }
            };

            if (cinemaName) {
                conflictQuery["cinema.name"] = { $regex: new RegExp(`^${cinemaName.trim()}$`, "i") };
            }

            const conflictingBooking = await Booking.findOne(conflictQuery).lean();

            if (conflictingBooking) {
                const takenSeats = normalizedSeats.filter((seat) =>
                    (conflictingBooking.seatNumbers || []).includes(seat)
                );

                return res.status(409).json({
                    conflict: true,
                    message: `Seat(s) ${takenSeats.join(", ")} have already been booked for this show. Please select other seats.`,
                    takenSeats
                });
            }
        }

        // 2. Validate Coupon if supplied
        let verifiedDiscount = 0;
        let appliedCouponCode = null;
        if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
            const normalizedCode = couponCode.trim().toUpperCase();
            const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
            if (coupon && (!coupon.expiryDate || new Date() <= new Date(coupon.expiryDate))) {
                appliedCouponCode = coupon.code;
                if (coupon.discountType === "flat") {
                    verifiedDiscount = Math.min(coupon.discountValue, price);
                } else {
                    verifiedDiscount = Math.round((price * coupon.discountValue) / 100);
                    if (coupon.maxDiscountAmount && verifiedDiscount > coupon.maxDiscountAmount) {
                        verifiedDiscount = coupon.maxDiscountAmount;
                    }
                }
            }
        }

        // 3. Save confirmed booking to MongoDB with status 'confirmed'
        const booking = await Booking.create({
            user: req.user._id,
            movieTitle: movieTitle.trim(),
            seats: seatCount,
            seatNumbers: normalizedSeats,
            showDate: showDate.trim(),
            showTime: showTime.trim(),
            cinema: {
                name: typeof cinema === "string" ? cinema : cinema.name || "Cinema",
                area: cinema.area || "",
                city: cinema.city || ""
            },
            totalPrice: price,
            couponCode: appliedCouponCode,
            discountAmount: verifiedDiscount,
            paymentMethod,
            paymentStatus: "paid",
            status: "confirmed"
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate("user", "username email")
            .lean();

        // 4. Generate PDF Ticket and dispatch email via Brevo in background
        (async () => {
            try {
                const pdfBuffer = await generateTicketPdf(populatedBooking);
                await sendTicketEmail({ booking: populatedBooking, pdfBuffer });
            } catch (pdfEmailErr) {
                console.error("Background PDF/Email generation failed:", pdfEmailErr);
            }
        })();

        return res.status(201).json({
            message: "Booking confirmed successfully! Your ticket has been emailed to you.",
            booking: populatedBooking
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error creating booking:", error);
        return res.status(500).json({ message: "Could not create booking." });
    }
};

/**
 * Download generated PDF ticket directly for a booking
 */
export const downloadTicketPdf = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid booking ID." });
    }

    try {
        const booking = await Booking.findById(id).populate("user", "username email").lean();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const pdfBuffer = await generateTicketPdf(booking);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="BookMyEvent-Ticket-${id}.pdf"`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating ticket PDF for download:", error);
        return res.status(500).json({ message: "Could not generate ticket PDF." });
    }
};

/**
 * Update booking status (Admin)
 */
export const updateBookingStatus = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid booking ID." });
    }
    const { status } = req.body || {};
    const normalizedStatus = status ? status.toLowerCase() : "";
    if (!["confirmed", "cancelled", "completed"].includes(normalizedStatus)) {
        return res.status(400).json({
            message: "Status must be confirmed, cancelled, or completed."
        });
    }

    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: normalizedStatus },
            { new: true, runValidators: true }
        ).populate("user", "username email").lean();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        return res.status(200).json({ message: "Booking status updated successfully.", booking });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error updating booking status:", error);
        return res.status(500).json({ message: "Could not update booking status." });
    }
};

/**
 * Update booking fields (Admin)
 */
export const updateBooking = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid booking ID." });
    }

    const { movieTitle, seats, totalPrice, status } = req.body || {};
    const updates = {};

    if (movieTitle !== undefined) {
        if (typeof movieTitle !== "string" || !movieTitle.trim()) {
            return res.status(400).json({ message: "Movie title must not be empty." });
        }
        updates.movieTitle = movieTitle.trim();
    }
    if (seats !== undefined) {
        const seatCount = Number(seats);
        if (!Number.isInteger(seatCount) || seatCount < 1) {
            return res.status(400).json({ message: "Seats must be a positive whole number." });
        }
        updates.seats = seatCount;
    }
    if (totalPrice !== undefined) {
        const price = Number(totalPrice);
        if (!Number.isFinite(price) || price < 0) {
            return res.status(400).json({ message: "Total price must be a non-negative number." });
        }
        updates.totalPrice = price;
    }
    if (status !== undefined) {
        const norm = status.toLowerCase();
        if (!["confirmed", "cancelled", "completed"].includes(norm)) {
            return res.status(400).json({
                message: "Status must be confirmed, cancelled, or completed."
            });
        }
        updates.status = norm;
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Provide booking fields to update." });
    }

    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate("user", "username email").lean();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        return res.status(200).json({ message: "Booking updated successfully.", booking });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error updating booking:", error);
        return res.status(500).json({ message: "Could not update booking." });
    }
};

/**
 * Delete a booking (Admin)
 */
export const deleteBooking = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid booking ID." });
    }

    try {
        const booking = await Booking.findByIdAndDelete(req.params.id)
            .populate("user", "username email")
            .lean();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        return res.status(200).json({ message: "Booking deleted successfully.", booking });
    } catch (error) {
        console.error("Error deleting booking:", error);
        return res.status(500).json({ message: "Could not delete booking." });
    }
};
