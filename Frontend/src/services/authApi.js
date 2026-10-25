import axios from "axios";

const authApi = axios.create({
  baseURL: process.env.REACT_APP_AUTH_API_URL || "http://localhost:5000/api/auth",
  headers: {
    "Content-Type": "application/json",
  },
});

export const register = async ({ username, email, password }) => {
  const { data } = await authApi.post("/register", { username, email, password });
  return data;
};

export const verifyOtp = async ({ email, otp }) => {
  const { data } = await authApi.post("/verify-otp", { email, otp });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await authApi.post("/login", { email, password });
  return data;
};

export const getCurrentUser = async (token) => {
  const { data } = await authApi.get("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
