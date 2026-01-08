// src/utils/axiosConfig.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Backend Render ou local
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =====================================================
   🔐 Ajout automatique du token JWT
===================================================== */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   ⚠️ Gestion sécurisée des erreurs 401 / 403
   (compatible HashRouter, sans reload serveur)
===================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (
      (status === 401 || status === 403) &&
      !window.location.hash.includes("/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // 🔥 Redirection CLIENT uniquement (aucun 404 possible)
      window.location.hash = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
