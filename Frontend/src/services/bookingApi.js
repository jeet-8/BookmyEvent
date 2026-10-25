import axios from "axios";

const apiBaseUrl =
  process.env.REACT_APP_AUTH_API_URL?.replace(/\/auth\/?$/, "") ||
  "http://localhost:5000/api";

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
  const { data } = await axios.post(
    `${apiBaseUrl}/bookings`,
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
  const { data } = await axios.post(`${apiBaseUrl}/coupons/apply`, {
    code,
    totalAmount,
  });
  return data;
};

/**
 * Fetch real-time booked seats for a particular show from the database
 */
export const getBookedSeatsApi = async ({ movieTitle, showDate, showTime, cinemaName }) => {
  const { data } = await axios.get(`${apiBaseUrl}/bookings/booked-seats`, {
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
