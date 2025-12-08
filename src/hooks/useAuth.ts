// src/hooks/useAuth.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { register, login, getProfile, logout } from "@/services/authService";

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => register(data),
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginData) => login(data),
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!localStorage.getItem("token"),
  });
};

export const useLogout = () => {
  return () => {
    logout();
    window.location.href = "/login";
  };
};
