// src/services/studentService.ts
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

export const getStudents = async (): Promise<Student[]> => {
  const { data } = await axios.get<Student[]>(API_URL);
  return data;
};
