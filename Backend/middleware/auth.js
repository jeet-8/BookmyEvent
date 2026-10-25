import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        const token = authorization.slice("Bearer ".length);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Not authorized, user no longer exists" });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Not authorized, token failed" });
        }

        console.error("Error verifying authentication:", error);
        return res.status(500).json({ message: "Error verifying authentication" });
    }
};