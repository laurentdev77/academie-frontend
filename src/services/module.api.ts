// src/services/module.api.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const moduleAPI = {
  // Récupérer les modules de l'enseignant connecté
  async myModules() {
    const token = localStorage.getItem("token");

    const res = await axios.get(`${API_URL}/modules/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Le backend renvoie souvent un objet { data: [...] }
    return res.data?.data ?? res.data;
  },

  // Récupérer un module spécifique
  async getModule(id: string) {
    const token = localStorage.getItem("token");

    const res = await axios.get(`${API_URL}/modules/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return res.data?.data ?? res.data;
  },

  // Ajouter un module
  async createModule(payload: any) {
    const token = localStorage.getItem("token");

    const res = await axios.post(`${API_URL}/modules`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return res.data?.data ?? res.data;
  },

  // Modifier un module
  async updateModule(id: string, payload: any) {
    const token = localStorage.getItem("token");

    const res = await axios.put(`${API_URL}/modules/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return res.data?.data ?? res.data;
  },

  // Supprimer
  async deleteModule(id: string) {
    const token = localStorage.getItem("token");

    const res = await axios.delete(`${API_URL}/modules/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return res.data?.data ?? res.data;
  },
};
