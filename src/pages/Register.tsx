import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { message, Spin } from "antd";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Upload photo vers /api/upload-photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("photo", file);

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/upload-photo", form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
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
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      if (res.data?.message) {
        message.success("Inscription réussie !");
        navigate("/login");
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
          <div>
            <label className="block text-sm font-medium mb-1">Nom d’utilisateur</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Adresse email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              type="text"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Photo de profil</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full"
            />
            {uploading && (
              <div className="text-blue-500 text-sm mt-1">Téléchargement en cours...</div>
            )}
            {formData.photoUrl && (
              <img
                src={`http://localhost:5000${formData.photoUrl}`}
                alt="Aperçu"
                className="mt-3 w-24 h-24 object-cover rounded-full border"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {loading ? <Spin /> : "S’inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
