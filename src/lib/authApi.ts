import api from "./axios";

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// 🔐 Login
export const login = async (data: LoginData) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

// 📝 Register
export const register = async (data: RegisterData) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

// 🚪 Logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};
