import axios from "axios";

// 🌍 URL backend Render
const API_URL = import.meta.env.VITE_API_URL;

// 🔹 Login
export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

// 🔹 Register
export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// 🟢 Connexion
export const login = async (data: LoginData) => {
  const response = await axios.post(`${API_URL}/auth/login`, data);
  return response.data;
};

// 🟢 Inscription
export const register = async (data: RegisterData) => {
  const response = await axios.post(`${API_URL}/auth/register`, data);
  return response.data;
};

// 🟡 Logout
export const logout = () => {
  localStorage.clear();
};
