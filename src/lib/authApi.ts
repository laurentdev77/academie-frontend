import axios from "axios";

// 🌍 Backend Render
const API_URL = import.meta.env.VITE_API_URL;

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export const login = async (data: LoginData) => {
  const response = await axios.post(`${API_URL}/login`, data);
  return response.data;
};
