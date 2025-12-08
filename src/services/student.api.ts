// frontend/src/services/student.api.ts
import axios from "axios";

export interface Student {
  id: string;
  nom: string;
  prenom: string;
  username?: string;
  email?: string;
  status?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/students";

export const studentAPI = {
  // Récupérer tous les étudiants
  getAll: async (): Promise<Student[]> => {
    const { data } = await axios.get<Student[]>(API_URL);
    return data;
  },

  // Récupérer un étudiant par ID
  getById: async (id: string): Promise<Student> => {
    const { data } = await axios.get<Student>(`${API_URL}/${id}`);
    return data;
  },

  // Créer un nouvel étudiant
  create: async (student: Partial<Student>): Promise<Student> => {
    const { data } = await axios.post<Student>(API_URL, student);
    return data;
  },

  // Mettre à jour un étudiant existant
  update: async (id: string, student: Partial<Student>): Promise<Student> => {
    const { data } = await axios.put<Student>(`${API_URL}/${id}`, student);
    return data;
  },

  // Supprimer un étudiant
  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },
};
