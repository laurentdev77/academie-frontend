// src/utils/axiosConfig.ts
import axios from "axios";

// ✅ Utiliser la variable d'environnement VITE_API_URL
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Render ou local
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Injection du token Authorization: Bearer token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Gestion des erreurs globale
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Erreur Axios:", error);
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;
