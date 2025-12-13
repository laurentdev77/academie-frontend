import api from "@/lib/axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// 📌 Interfaces
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
  const response = await api.post(`/auth/login`, data);
  return response.data;
};

// 🔹 Inscription
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post(`/auth/register`, data);
  return response.data;
};

// 🔹 Déconnexion
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
