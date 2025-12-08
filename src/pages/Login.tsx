import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logoacademie.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login, LoginData } from "@/lib/authApi";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); // exactement "username"
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsPending(true);

  try {
    const data: LoginData = { username, password };
    const response = await login(data);

    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));

    // 👉 AJOUT ULTRA IMPORTANT POUR LES RÔLES
    if (response.user?.role?.name) {
      localStorage.setItem("role", response.user.role.name.toLowerCase());
    }

    navigate("/dashboard");
  } catch (err: any) {
    setError(err.response?.data?.message || "Erreur de connexion");
  } finally {
    setIsPending(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-6">
      <img
        src={Logo}
        alt="Académie Militaire"
        className="w-32 sm:w-40 mb-6 transition-transform duration-500 hover:scale-105 hover:rotate-3"
      />

      <h1 className="text-2xl sm:text-3xl font-bold mb-8">Connexion</h1>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        {error && <p className="text-red-500 text-center">{error}</p>}

        <div>
          <label className="block mb-1 font-medium">Nom d'utilisateur</label>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur"
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Mot de passe</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className={`w-full bg-blue-700 hover:bg-blue-800 text-white py-2 mt-2 transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            isPending ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isPending ? "Connexion..." : "Se connecter"}
        </Button>

        <div className="text-center mt-4">
          <span>Pas encore inscrit ? </span>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-green-700 font-semibold hover:underline"
          >
            Créer un compte
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
