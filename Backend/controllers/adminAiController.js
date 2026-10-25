import { GoogleGenAI } from "@google/genai";
import Booking from "../models/bookingModel.js";
import Movie from "../models/movieModel.js";
import User from "../models/user.js";

const validHistoryMessage = (message) =>
    message &&
    ["user", "model"].includes(message.role) &&
    typeof message.text === "string" &&
    message.text.trim().length > 0 &&
    message.text.length <= 4000;

export const postAdminAiChat = async (req, res) => {
    const { message, history = [] } = req.body || {};
    if (typeof message !== "string" || !message.trim() || message.length > 4000) {
        return res.status(400).json({ message: "Enter a message of up to 4,000 characters." });
    }
    if (!Array.isArray(history) || history.length > 12 || history.some((item) => !validHistoryMessage(item))) {
        return res.status(400).json({ message: "Chat history is invalid. Start a new conversation and try again." });
    }
    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ message: "Admin AI chat is not configured. Set GEMINI_API_KEY on the backend." });
    }

    try {
        const [totalUsers, totalMovies, totalBookings, revenue, popularMovies] = await Promise.all([
            User.countDocuments(),
            Movie.countDocuments(),
            Booking.countDocuments(),
            Booking.aggregate([
                { $match: { status: { $ne: "Cancelled" } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Booking.aggregate([
                { $group: { _id: "$movieTitle", bookings: { $sum: 1 } } },
                { $sort: { bookings: -1 } },
                { $limit: 5 }
            ])
        ]);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const candidateModels = [
            process.env.GEMINI_MODEL || "gemini-3.8-flash",
            "gemini-3.5-flash",
            "gemini-flash-latest"
        ].filter((val, idx, arr) => arr.indexOf(val) === idx);

        let response = null;
        let lastError = null;

        for (const candidate of candidateModels) {
            try {
                response = await ai.models.generateContent({
                    model: candidate,
                    contents: [
                        ...history.map(({ role, text }) => ({ role, parts: [{ text: text.trim() }] })),
                        { role: "user", parts: [{ text: message.trim() }] }
                    ],
                    config: {
                        maxOutputTokens: 600,
                        systemInstruction: `You are BookMyEvent's admin dashboard assistant. Help the administrator understand the platform and suggest operational next steps. Do not claim to perform changes; the admin must use the dashboard to make them. Use only this current aggregate data when discussing metrics: ${JSON.stringify({
                            totalUsers,
                            totalMovies,
                            totalBookings,
                            revenue: revenue[0]?.total || 0,
                            popularMovies
                        })}. This context contains no customer personal information. Be concise and state when the data does not answer a question.`
                    }
                });
                if (response?.text?.trim()) break;
            } catch (err) {
                lastError = err;
                console.warn(`Gemini model ${candidate} failed:`, err.message || err);
            }
        }

        const reply = response?.text?.trim();
        if (!reply) {
            if (lastError?.status === 429 || lastError?.status === 503) {
                return res.status(503).json({ message: "The AI assistant is temporarily busy. Please wait a moment and try again." });
            }
            return res.status(502).json({ message: "The AI assistant could not respond. Please try again." });
        }
        return res.status(200).json({ reply });
    } catch (error) {
        console.error("Error processing admin AI chat:", {
            name: error.name,
            message: error.message,
            status: error.status,
            code: error.code
        });
        if (error.status === 429 || error.status === 503) {
            return res.status(503).json({ message: "The AI assistant is busy. Please wait a moment and try again." });
        }
        return res.status(502).json({ message: "The AI assistant could not respond. Please try again." });
    }
};
