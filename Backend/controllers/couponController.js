import mongoose from "mongoose";
import Coupon from "../models/couponModel.js";

/**
 * Get all coupons (Admin)
 */
export const getAdminCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
        return res.status(200).json({
            success: true,
            message: "Coupons retrieved successfully.",
            coupons
        });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        return res.status(500).json({ message: "Could not retrieve coupons." });
    }
};

/**
 * Create a new coupon (Admin)
 */
export const createAdminCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType = "percentage",
            discountValue,
            minOrderAmount = 0,
            maxDiscountAmount,
            isActive = true,
            expiryDate,
            description = ""
        } = req.body || {};

        if (!code || !code.trim()) {
            return res.status(400).json({ message: "Coupon code is required." });
        }

        const normalizedCode = code.trim().toUpperCase();

        const existing = await Coupon.findOne({ code: normalizedCode });
        if (existing) {
            return res.status(400).json({ message: `Coupon with code "${normalizedCode}" already exists.` });
        }

        const value = Number(discountValue);
        if (!Number.isFinite(value) || value <= 0) {
            return res.status(400).json({ message: "Discount value must be a positive number." });
        }

        if (discountType === "percentage" && (value <= 0 || value > 100)) {
            return res.status(400).json({ message: "Percentage discount must be between 1 and 100%." });
        }

        const minOrder = Number(minOrderAmount) || 0;
        if (minOrder < 0) {
            return res.status(400).json({ message: "Minimum order amount cannot be negative." });
        }

        const coupon = await Coupon.create({
            code: normalizedCode,
            discountType: discountType === "flat" ? "flat" : "percentage",
            discountValue: value,
            minOrderAmount: minOrder,
            maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
            isActive: Boolean(isActive),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            description: description.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Coupon created successfully.",
            coupon
        });
    } catch (error) {
        console.error("Error creating coupon:", error);
        return res.status(500).json({ message: error.message || "Could not create coupon." });
    }
};

/**
 * Update an existing coupon (Admin)
 */
export const updateAdminCoupon = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid coupon ID." });
    }

    try {
        const {
            code,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            isActive,
            expiryDate,
            description
        } = req.body || {};

        const updates = {};

        if (code !== undefined) {
            if (!code.trim()) return res.status(400).json({ message: "Coupon code cannot be empty." });
            const normalizedCode = code.trim().toUpperCase();
            const duplicate = await Coupon.findOne({ code: normalizedCode, _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({ message: `Coupon "${normalizedCode}" is already in use.` });
            }
            updates.code = normalizedCode;
        }

        if (discountType !== undefined) {
            if (!["percentage", "flat"].includes(discountType)) {
                return res.status(400).json({ message: "Discount type must be percentage or flat." });
            }
            updates.discountType = discountType;
        }

        if (discountValue !== undefined) {
            const val = Number(discountValue);
            if (!Number.isFinite(val) || val <= 0) {
                return res.status(400).json({ message: "Discount value must be a positive number." });
            }
            updates.discountValue = val;
        }

        if (minOrderAmount !== undefined) {
            const minOrder = Number(minOrderAmount);
            if (!Number.isFinite(minOrder) || minOrder < 0) {
                return res.status(400).json({ message: "Minimum order amount cannot be negative." });
            }
            updates.minOrderAmount = minOrder;
        }

        if (maxDiscountAmount !== undefined) {
            updates.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
        }

        if (isActive !== undefined) {
            updates.isActive = Boolean(isActive);
        }

        if (expiryDate !== undefined) {
            updates.expiryDate = expiryDate ? new Date(expiryDate) : null;
        }

        if (description !== undefined) {
            updates.description = description.trim();
        }

        const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Coupon updated successfully.",
            coupon
        });
    } catch (error) {
        console.error("Error updating coupon:", error);
        return res.status(500).json({ message: error.message || "Could not update coupon." });
    }
};

/**
 * Delete a coupon (Admin)
 */
export const deleteAdminCoupon = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid coupon ID." });
    }

    try {
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Coupon deleted successfully.",
            coupon
        });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return res.status(500).json({ message: "Could not delete coupon." });
    }
};

/**
 * Apply coupon and calculate discount (User checkout)
 */
export const applyCoupon = async (req, res) => {
    try {
        const { code, totalAmount } = req.body || {};

        if (!code || typeof code !== "string" || !code.trim()) {
            return res.status(400).json({ message: "Please enter a coupon code." });
        }

        const orderTotal = Number(totalAmount);
        if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
            return res.status(400).json({ message: "Valid order amount is required to apply coupon." });
        }

        const normalizedCode = code.trim().toUpperCase();
        const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });

        if (!coupon) {
            return res.status(404).json({
                valid: false,
                message: `Coupon code "${normalizedCode}" is invalid or inactive.`
            });
        }

        // Check expiration
        if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
            return res.status(400).json({
                valid: false,
                message: `Coupon "${normalizedCode}" has expired.`
            });
        }

        // Check minimum order
        if (orderTotal < coupon.minOrderAmount) {
            return res.status(400).json({
                valid: false,
                message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.`
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === "flat") {
            discount = Math.min(coupon.discountValue, orderTotal);
        } else {
            discount = Math.round((orderTotal * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        }

        const finalAmount = Math.max(0, orderTotal - discount);

        return res.status(200).json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: discount,
            finalAmount,
            message: `Coupon "${coupon.code}" applied! You saved ₹${discount}.`
        });
    } catch (error) {
        console.error("Error applying coupon:", error);
        return res.status(500).json({ message: "Failed to apply coupon." });
    }
};
