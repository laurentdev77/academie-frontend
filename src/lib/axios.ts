// src/lib/axios.ts
import axios from "axios";

// Utilisation de la variable d'environnement Vite
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
});

// Intercepteur pour attacher automatiquement le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
