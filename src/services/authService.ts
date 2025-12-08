import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth";

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  roleId?: number | null;
  role?: { id: number; name: string } | null;
  status?: string;
  [key: string]: any;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// 🔹 Connexion
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/login`, data);
  return response.data;
};

// 🔹 Inscription
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register`, data);
  return response.data;
};

// 🔹 Déconnexion
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
