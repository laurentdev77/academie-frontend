import axios from "axios";

// 🌍 Base URL du backend hébergé (Render)
// IMPORTANT : localhost ne fonctionne pas en production
const API_URL = import.meta.env.VITE_API_URL || "https://academie-backend-2.onrender.com/api/auth";

// 🔹 Type pour la connexion
export interface LoginData {
  usernameOrEmail: string; // correspond au backend
  password: string;
}

// 🔹 Type pour l'inscription
export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// 🟢 Connexion
export const login = async (data: LoginData) => {
  const response = await axios.post(`${API_URL}/login`, data);
  return response.data;
};

// 🟢 Inscription
export const register = async (data: RegisterData) => {
  const response = await axios.post(`${API_URL}/register`, data);
  return response.data;
};

// 🟡 Déconnexion
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};
