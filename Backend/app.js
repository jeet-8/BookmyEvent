import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';  
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import movieRoutes from './routes/movies.js';
import uploadRoutes from './routes/uploadRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '.env') });

const app = express();

// Configured CORS to allow your Vercel domains and local environments with credentials
app.use(cors({
  origin: [
    'https://bookmy-event-jeet-0f47.vercel.app',
    'https://bookmy-event.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to your .env file.");
}

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api", reviewRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/upload", uploadRoutes);

await connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});