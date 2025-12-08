// src/lib/api.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// 🔥 Instance Axios centralisée
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Ajouter automatiquement le JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔹 Gestion d’erreurs globales
api.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error("Erreur API:", error?.response?.data || error.message);

    // 🔥 Cas très fréquent : token expiré → 401
    if (error.response?.status === 401) {
      console.warn("401 Unauthorized → redirection vers /login");

      localStorage.removeItem("token"); // Important : on nettoie
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
