import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/userModel.js";

const publicUserFields = "-password";

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select(publicUserFields).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ message: "Users retrieved successfully.", users });
    } catch (error) {
        console.error("Error retrieving users:", error);
        return res.status(500).json({ message: "Could not retrieve users." });
    }
};

export const getUserById = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        const user = await User.findById(req.params.id).select(publicUserFields).lean();
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "User retrieved successfully.", user });
    } catch (error) {
        console.error("Error retrieving user:", error);
        return res.status(500).json({ message: "Could not retrieve user." });
    }
};

export const createUser = async (req, res) => {
    const { username, email, password, role } = req.body || {};
    if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({ message: "Username, email, and password are required." });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "A user with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            username: username.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            ...(role !== undefined ? { role } : {})
        });
        const safeUser = await User.findById(user._id).select(publicUserFields).lean();

        return res.status(201).json({ message: "User created successfully.", user: safeUser });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A user with this email already exists." });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Could not create user." });
    }
};

export const updateUser = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    const updates = {};
    const { username, email, role } = req.body || {};
    if (username !== undefined) {
        if (typeof username !== "string" || !username.trim()) {
            return res.status(400).json({ message: "Username must not be empty." });
        }
        updates.username = username.trim();
    }
    if (email !== undefined) {
        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ message: "Email must not be empty." });
        }
        updates.email = email.trim().toLowerCase();
    }
    if (role !== undefined) {
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be user or admin." });
        }
        updates.role = role;
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Provide username, email, or role to update." });
    }

    try {
        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
            select: publicUserFields
        }).lean();
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "User updated successfully.", user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A user with this email already exists." });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Could not update user." });
    }
};

export const deleteUser = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        const user = await User.findByIdAndDelete(req.params.id).select(publicUserFields).lean();
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "User deleted successfully.", user });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Could not delete user." });
    }
};
