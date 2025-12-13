import axios from "axios";

// 🌍 Backend Render
const API_URL = import.meta.env.VITE_API_URL;

export interface LoginData {
  usernameOrEmail: string; // ✅ correspond au backend
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: any;
}

// 🔐 Connexion
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/login`, data);
  return response.data;
};

// 📝 Inscription
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register`, data);
  return response.data;
};

// 🚪 Déconnexion
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};
