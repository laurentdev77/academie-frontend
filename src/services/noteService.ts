import axios from "axios";

export interface Note {
  id?: string;
  studentId: string;
  moduleId: string;
  value: number;
  coefficient?: number;
  type?: string;
  studentName?: string;
  moduleName?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Récupère toutes les notes, avec possibilité de recherche.
 */
export const fetchNotes = async (search = "", token = ""): Promise<Note[]> => {
  const res = await axios.get(`${API_BASE}/notes`, {
    params: { search },
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return res.data;
};

/**
 * Crée une nouvelle note.
 */
export const createNote = async (payload: Note, token = "") => {
  const res = await axios.post(`${API_BASE}/notes`, payload, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return res.data;
};

/**
 * Met à jour une note existante.
 */
export const updateNote = async (
  id: string,
  values: Partial<Note>,
  token = ""
) => {
  const res = await axios.put(`${API_BASE}/notes/${id}`, values, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return res.data;
};

/**
 * Supprime une note.
 */
export const deleteNote = async (id: string, token = "") => {
  const res = await axios.delete(`${API_BASE}/notes/${id}`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return res.data;
};
