import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Coupon code is required"],
            unique: true,
            uppercase: true,
            trim: true
        },
        discountType: {
            type: String,
            enum: ["percentage", "flat"],
            required: [true, "Discount type is required (percentage or flat)"],
            default: "percentage"
        },
        discountValue: {
            type: Number,
            required: [true, "Discount value is required"],
            min: [1, "Discount value must be at least 1"]
        },
        minOrderAmount: {
            type: Number,
            default: 0,
            min: [0, "Minimum order amount cannot be negative"]
        },
        maxDiscountAmount: {
            type: Number,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        },
        expiryDate: {
            type: Date,
            default: null
        },
        description: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

export default Coupon;
