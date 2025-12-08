// src/utils/axiosConfig.ts

import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// =============================================
// 🔐 Injection correcte du token (Authorization: Bearer token)
// =============================================
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token && config.headers) {
      config.headers["authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================
// Gestion des erreurs globale
// =============================================
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
