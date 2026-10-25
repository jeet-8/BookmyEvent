import mongoose from "mongoose";
import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Coupon from "../models/couponModel.js";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const sampleCoupons = [
    {
        code: "WELCOME50",
        discountType: "percentage",
        discountValue: 50,
        minOrderAmount: 200,
        maxDiscountAmount: 150,
        isActive: true,
        description: "50% off up to ₹150 for new moviegoers"
    },
    {
        code: "FLAT100",
        discountType: "flat",
        discountValue: 100,
        minOrderAmount: 300,
        isActive: true,
        description: "Flat ₹100 off on minimum purchase of ₹300"
    },
    {
        code: "BME20",
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 150,
        maxDiscountAmount: 100,
        isActive: true,
        description: "20% off on all weekend tickets"
    }
];

const seedCoupons = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding coupons...");

        for (const item of sampleCoupons) {
            await Coupon.findOneAndUpdate(
                { code: item.code },
                { $set: item },
                { upsert: true, new: true }
            );
            console.log(`Seeded coupon: ${item.code}`);
        }

        console.log("Coupons seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Failed to seed coupons:", error);
        process.exit(1);
    }
};

seedCoupons();
