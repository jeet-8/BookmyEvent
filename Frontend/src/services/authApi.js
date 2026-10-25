import API from "../api/axios";

export const register = async ({ username, email, password }) => {
  const { data } = await API.post("/api/auth/register", { username, email, password });
  return data;
};

export const verifyOtp = async ({ email, otp }) => {
  const { data } = await API.post("/api/auth/verify-otp", { email, otp });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await API.post("/api/auth/login", { email, password });
  return data;
};

export const getCurrentUser = async (token) => {
  const { data } = await API.get("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
