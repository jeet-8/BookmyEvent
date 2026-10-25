import jwt from "jsonwebtoken";

export const protectAdmin = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Admin login required." });
    }

    try {
        const token = authorization.slice("Bearer ".length);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Admin access required." });
        }

        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Admin session expired. Please sign in again." });
        }

        console.error("Error verifying admin access:", error);
        return res.status(500).json({ message: "Could not verify admin access." });
    }
};
