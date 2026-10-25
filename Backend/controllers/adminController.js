import { timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Booking from "../models/bookingModel.js";

const secureStringEqual = (received, configured) => {
    const receivedBuffer = Buffer.from(received);
    const configuredBuffer = Buffer.from(configured);
    return receivedBuffer.length === configuredBuffer.length &&
        timingSafeEqual(receivedBuffer, configuredBuffer);
};

export const loginAdmin = async (req, res) => {
    const { email, password } = req.body || {};

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        return res.status(503).json({ message: "Admin login is not configured on the server." });
    }

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Email and password are required." });
    }

    if (
        !secureStringEqual(email.trim().toLowerCase(), process.env.ADMIN_EMAIL.trim().toLowerCase()) ||
        !secureStringEqual(password, process.env.ADMIN_PASSWORD)
    ) {
        return res.status(401).json({ message: "Invalid admin email or password." });
    }

    const token = jwt.sign(
        { role: "admin", email: process.env.ADMIN_EMAIL },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
    );

    return res.status(200).json({
        message: "Admin login successful.",
        admin: { email: process.env.ADMIN_EMAIL },
        token
    });
};

export const getAdminDashboard = async (req, res) => {
    try {
        const [totalUsers, totalBookings, revenue, recentBookings] = await Promise.all([
            User.countDocuments(),
            Booking.countDocuments(),
            Booking.aggregate([
                { $match: { status: { $ne: "Cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Booking.find()
                .populate("user", "username email")
                .sort({ bookingDate: -1 })
                .limit(5)
                .lean()
        ]);
        return res.status(200).json({
            metrics: {
                totalUsers,
                totalBookings,
                revenue: revenue[0]?.total || 0
            },
            recentBookings
        });
    } catch (error) {
        console.error("Error loading admin dashboard:", error);
        return res.status(500).json({ message: "Could not load admin dashboard." });
    }
};

export const getAdminUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();
        return res.status(200).json({ users });
    } catch (error) {
        console.error("Error loading admin users:", error);
        return res.status(500).json({ message: "Could not load registered users." });
    }
};
