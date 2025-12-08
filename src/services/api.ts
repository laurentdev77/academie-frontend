import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://academie-backend-2.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Intercepteur pour injecter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Intercepteur global pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("🔒 Token expiré ou invalide — redirection vers /login.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
