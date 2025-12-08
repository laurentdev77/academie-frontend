import axios from "axios";

// 🌍 Base URL du backend
const API_URL = "http://localhost:5000/api/auth";

// 🔹 Type pour la connexion
export interface LoginData {
  username: string; // doit correspondre exactement au backend
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
};
