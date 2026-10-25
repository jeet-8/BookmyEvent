import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    movieTitle: {
        type: String,
        required: true,
        trim: true
    },
    seats: {
        type: Number,
        required: true,
        min: 1,
        validate: Number.isInteger
    },
    seatNumbers: {
        type: [String],
        default: []
    },
    showDate: {
        type: String,
        trim: true,
        default: ""
    },
    showTime: {
        type: String,
        trim: true,
        default: ""
    },
    cinema: {
        name: { type: String, trim: true, default: "" },
        area: { type: String, trim: true, default: "" },
        city: { type: String, trim: true, default: "" }
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    couponCode: {
        type: String,
        uppercase: true,
        trim: true,
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        default: "UPI_QR"
    },
    paymentStatus: {
        type: String,
        enum: ["paid", "pending", "failed"],
        default: "paid"
    },
    status: {
        type: String,
        enum: ["confirmed", "Confirmed", "cancelled", "Cancelled", "completed", "Completed"],
        default: "confirmed"
    },
    bookingDate: {
        type: Date,
        default: Date.now
    }
});

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
