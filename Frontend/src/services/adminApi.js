const rawBaseUrl = (
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_ADMIN_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const configuredBaseUrl = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl}/api`;

export class AdminApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

const adminRequest = async (path, options = {}) => {
  const token = localStorage.getItem("adminToken");
  const headers = {
    Accept: "application/json",
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${configuredBaseUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new AdminApiError("Cannot reach the backend. Check that it is running.");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" && payload?.message
      ? payload.message
      : `Admin API request failed (${response.status}).`;
    throw new AdminApiError(message, response.status);
  }
  return payload;
};

export const adminApi = {
  login: (credentials) =>
    adminRequest("/admin/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  getDashboard: () => adminRequest("/admin/dashboard"),
  sendAiChat: (message, history) =>
    adminRequest("/admin/ai-chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return adminRequest("/upload", {
      method: "POST",
      body: formData,
    });
  },
  getUsers: () => adminRequest("/users"),
  updateUser: (id, user) =>
    adminRequest(`/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(user),
    }),
  deleteUser: (id) =>
    adminRequest(`/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  getMovies: async () => {
    const result = await adminRequest("/admin/movies");
    if (!Array.isArray(result?.movies)) {
      throw new AdminApiError("The movies endpoint returned an invalid response.");
    }
    return result.movies.map((movie) => ({
      ...movie,
      id: movie._id || movie.id,
    }));
  },
  createMovie: (movie) =>
    adminRequest("/admin/movies", {
      method: "POST",
      body: JSON.stringify(movie),
    }),
  updateMovie: (id, movie) =>
    adminRequest(`/admin/movies/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(movie),
    }),
  deleteMovie: (id) =>
    adminRequest(`/admin/movies/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  getBookings: () => adminRequest("/bookings"),
  updateBooking: (id, booking) =>
    adminRequest(`/bookings/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(booking),
    }),
  getCoupons: async () => {
    const result = await adminRequest("/admin/coupons");
    return Array.isArray(result?.coupons) ? result.coupons : [];
  },
  createCoupon: (coupon) =>
    adminRequest("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(coupon),
    }),
  updateCoupon: (id, coupon) =>
    adminRequest(`/admin/coupons/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(coupon),
    }),
  deleteCoupon: (id) =>
    adminRequest(`/admin/coupons/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
