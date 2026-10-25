import express from "express";
import cloudinary from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { protectAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const cloudinaryV2 = cloudinary.v2;
const storage = new CloudinaryStorage({
    cloudinary: cloudinaryV2,
    params: {
        folder: "BookMyEvent/movies",
        resource_type: "image"
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.mimetype)) {
            return callback(new Error("Only JPEG, PNG, WebP, GIF, or AVIF images can be uploaded."));
        }
        return callback(null, true);
    }
});

router.post("/", protectAdmin, (req, res) => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return res.status(503).json({ message: "Cloudinary image uploads are not configured." });
    }

    cloudinaryV2.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    });

    return upload.single("image")(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            return res.status(status).json({
                message: error.code === "LIMIT_FILE_SIZE"
                    ? "Image must be 5 MB or smaller."
                    : "Upload one image file using the image field."
            });
        }
        if (error) {
            if (error.message.startsWith("Only ")) {
                return res.status(400).json({ message: error.message });
            }
            console.error("Error uploading movie image:", error.message);
            return res.status(502).json({
                message: "Could not upload image to Cloudinary."
            });
        }
        if (!req.file?.path) {
            return res.status(400).json({ message: "Choose an image file to upload." });
        }
        return res.status(200).json({ success: true, url: req.file.path });
    });
});

export default router;
