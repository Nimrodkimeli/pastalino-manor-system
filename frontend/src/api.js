import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pastalino_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function saveSession(user, token) {
  localStorage.setItem("pastalino_user", JSON.stringify(user));
  localStorage.setItem("pastalino_token", token);
}

export function clearSession() {
  localStorage.removeItem("pastalino_user");
  localStorage.removeItem("pastalino_token");
}

export function getSession() {
  const user = localStorage.getItem("pastalino_user");
  return user ? JSON.parse(user) : null;
}

export function updateSessionUser(nextUser) {
  localStorage.setItem("pastalino_user", JSON.stringify(nextUser));
}

export default api;
