import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import api from "@/utils/axiosConfig";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    telephone: "",
    photoUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("photo", file);

    try {
      setUploading(true);
      const res = await api.post("/upload-photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, photoUrl: res.data.url }));
        message.success("Photo téléchargée !");
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Erreur upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ✅ Empêche reload
    setLoading(true);

    try {
      const res = await api.post("/auth/register", formData);
      if (res.data?.message) {
        message.success("Inscription réussie !");
        navigate("/login", { replace: true }); // ✅ redirection sécurisée
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Erreur d’inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Créer un compte
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            placeholder="Nom d’utilisateur"
            required
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            required
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />
          <input
            name="telephone"
            placeholder="Téléphone"
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <input type="file" accept="image/*" onChange={handlePhotoUpload} />

          {formData.photoUrl && (
            <img
              src={`${API_BASE}${formData.photoUrl}`}
              alt="Avatar"
              className="w-24 h-24 rounded-full mt-3 object-cover"
            />
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center gap-2"
          >
            {loading ? <Spin /> : "S’inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
