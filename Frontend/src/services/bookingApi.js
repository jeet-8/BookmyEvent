import API from "../api/axios";

const rawApiUrl = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const apiBaseUrl = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

/**
 * Create a new movie booking with seat locking and payment confirmation
 */
export const createBooking = async ({
  movieTitle,
  seats,
  seatNumbers,
  showDate,
  showTime,
  cinema,
  totalPrice,
  couponCode,
  paymentMethod = "UPI_QR",
  token,
}) => {
  const { data } = await API.post(
    "/api/bookings",
    {
      movieTitle,
      seats,
      seatNumbers,
      showDate,
      showTime,
      cinema,
      totalPrice,
      couponCode,
      paymentMethod,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

/**
 * Validate coupon code and get calculated discount
 */
export const applyCouponApi = async ({ code, totalAmount }) => {
  const { data } = await API.post("/api/coupons/apply", {
    code,
    totalAmount,
  });
  return data;
};

/**
 * Fetch real-time booked seats for a particular show from the database
 */
export const getBookedSeatsApi = async ({ movieTitle, showDate, showTime, cinemaName }) => {
  const { data } = await API.get("/api/bookings/booked-seats", {
    params: { movieTitle, showDate, showTime, cinemaName },
  });
  return data;
};

/**
 * Returns direct URL to download generated PDF ticket
 */
export const getTicketPdfUrl = (bookingId) => {
  return `${apiBaseUrl}/bookings/${encodeURIComponent(bookingId)}/pdf`;
};
