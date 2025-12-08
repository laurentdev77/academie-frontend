// src/hooks/useAuth.ts
import { useMutation } from "@tanstack/react-query";
import { register, login, logout } from "@/services/authService";

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// ⚠️ Votre backend attend :
// { usernameOrEmail, password }
interface LoginData {
  usernameOrEmail: string;
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

// ❌ getProfile supprimé — il n'existe pas dans authService
// Si vous voulez récupérer le profil plus tard,
// il faudra d'abord ajouter la fonction dans le backend + service.

export const useLogout = () => {
  return () => {
    logout();
    window.location.href = "/login";
  };
};