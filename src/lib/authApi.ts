import api from "./api";

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
  const res = await api.post("/auth/login", data);
  return res.data;
};

// 📝 Register
export const register = async (data: RegisterData) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

// 🚪 Logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};
