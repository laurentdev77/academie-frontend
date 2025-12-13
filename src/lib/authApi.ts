import axios from "axios";

// 🌍 Base URL backend (SANS /auth)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// 🔹 Types
export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// 🟢 Connexion
export const login = async (data: LoginData) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login`,
    data
  );
  return response.data;
};

// 🟢 Inscription
export const register = async (data: RegisterData) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/register`,
    data
  );
  return response.data;
};

// 🟡 Déconnexion
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};
