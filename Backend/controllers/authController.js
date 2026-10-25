import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import User from "../models/user.js";

const createToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

const hashOtp = (otp) =>
    createHmac("sha256", process.env.JWT_SECRET).update(otp).digest("hex");

const escapeHtml = (value) =>
    value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);

const sendVerificationEmail = async ({ email, username, otp }) => {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: "BookMyEvent",
                email: process.env.SENDER_EMAIL
            },
            to: [{ email, name: username }],
            subject: "Your BookMyEvent verification code",
            htmlContent: `<div style="font-family:Arial,sans-serif;padding:20px">
                <h2>Welcome to BookMyEvent, ${escapeHtml(username)}!</h2>
                <p>Your one-time verification code is:</p>
                <h1 style="color:#e50914;letter-spacing:5px">${otp}</h1>
                <p>This code expires in 10 minutes.</p>
            </div>`
        })
    });

    if (!response.ok) {
        let details = "";
        try {
            const data = await response.json();
            details = data?.message || JSON.stringify(data);
        } catch {
            details = await response.text().catch(() => "");
        }
        const error = new Error(`Brevo email request failed with status ${response.status}: ${details}`);
        error.status = response.status;
        error.details = details;
        throw error;
    }
};

const getEmailDeliveryErrorMessage = (status, details = "") => {
    if (details) {
        if (/unrecogni[sz]ed IP|authorised_ips|authorized_ips/i.test(details)) {
            return `Brevo blocked this request: your IP address is not authorized. Please allow your IP in Brevo settings (https://app.brevo.com/security/authorised_ips). Details: ${details}`;
        }
        if (status === 401 || status === 403) {
            return `Brevo authentication failed: ${details}. Please check BREVO_API_KEY and authorized IPs.`;
        }
        if (status === 400) {
            return `Brevo rejected request: ${details}. Verify SENDER_EMAIL in Brevo.`;
        }
    }
    if (status === 400) {
        return "Brevo rejected the sender or recipient. Verify SENDER_EMAIL in Brevo and check the recipient address.";
    }
    if (status === 401 || status === 403) {
        return "Brevo rejected the API key. Check that BREVO_API_KEY is valid and has permission to send emails.";
    }
    if (status === 429) {
        return "Brevo's email sending limit was reached. Please try again later.";
    }
    if (!status) {
        return "Could not connect to Brevo. Check the backend network connection and try again.";
    }
    return details || "Brevo could not send the verification email. Please try again later.";
};

export const registerUser = async (req, res) => {
    const { username, email, password } = req.body || {};

    if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
        console.error("Brevo registration email is not configured.");
        return res.status(500).json({ message: "Email verification is temporarily unavailable." });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });

        if (user && user.isVerified !== false) {
            return res.status(400).json({
                message: "User already registered. Please login."
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = randomInt(100000, 1000000).toString();

        if (!user) {
            user = new User({
                username: username.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                isVerified: false
            });
        } else {
            user.username = username.trim();
            user.password = hashedPassword;
        }

        user.isVerified = false;
        user.otpHash = hashOtp(otp);
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        user.otpAttempts = 0;
        await user.save();

        try {
            await sendVerificationEmail({
                email: normalizedEmail,
                username: user.username,
                otp
            });
        } catch (emailError) {
            console.error(
                "Error sending registration verification email:",
                emailError.message,
                emailError.status ? `(HTTP ${emailError.status})` : "(network error)"
            );
            return res.status(502).json({
                message: getEmailDeliveryErrorMessage(emailError.status, emailError.details)
            });
        }

        return res.status(201).json({
            message: "A verification code was sent to your email.",
            requiresVerification: true
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "User already registered. Please login."
            });
        }
        console.error("Error registering user:", error);
        return res.status(500).json({
            message: "Error occurred while registering user"
        });
    }
};

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body || {};
    if (
        typeof email !== "string" ||
        typeof otp !== "string" ||
        !email.trim() ||
        !/^\d{6}$/.test(otp)
    ) {
        return res.status(400).json({ message: "Enter a valid email and 6-digit verification code." });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail })
            .select("+otpHash +otpExpiresAt +otpAttempts");

        if (!user || user.isVerified !== false || !user.otpHash || !user.otpExpiresAt) {
            return res.status(400).json({ message: "No pending email verification was found." });
        }

        if (user.otpExpiresAt.getTime() <= Date.now()) {
            return res.status(400).json({ message: "Verification code expired. Register again to get a new code." });
        }

        if (user.otpAttempts >= 5) {
            return res.status(429).json({ message: "Too many incorrect codes. Register again to get a new code." });
        }

        const expectedHash = Buffer.from(user.otpHash, "hex");
        const submittedHash = Buffer.from(hashOtp(otp), "hex");
        if (
            expectedHash.length !== submittedHash.length ||
            !timingSafeEqual(expectedHash, submittedHash)
        ) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ message: "Invalid verification code." });
        }

        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        user.otpAttempts = 0;
        await user.save();

        return res.status(200).json({
            message: "Email verified successfully.",
            id: user._id,
            username: user.username,
            email: user.email,
            token: createToken(user._id)
        });
    } catch (error) {
        console.error("Error verifying registration code:", error);
        return res.status(500).json({ message: "Could not verify the code." });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body || {};

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                message: "User not found. Please register first."
            });
        }

        if (user.isVerified === false) {
            return res.status(403).json({
                message: "Please verify your email before signing in."
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        return res.status(200).json({
            message: "Login successful.",
            id: user._id,
            username: user.username,
            email: user.email,
            token: createToken(user._id)
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({
            message: "Error occurred while logging in user"
        });
    }
};
