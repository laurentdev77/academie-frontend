import api from "./api";

export interface Teacher {
  id: string;
  username: string;
  email: string;
  role?: {
    id: number;
    name: string;
  };
}

/**
 * 🔹 Récupère tous les enseignants depuis /users/teachers
 */
export const fetchTeachers = async (): Promise<Teacher[]> => {
  const res = await api.get("/users/teachers");
  return res.data;
};

/**
 * 🔹 Récupère un enseignant par ID
 */
export const getTeacherById = async (id: string): Promise<Teacher> => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

/**
 * 🔹 Crée un enseignant (si ton backend le permet)
 */
export const createTeacher = async (teacher: Omit<Teacher, "id">): Promise<Teacher> => {
  const res = await api.post("/users", teacher);
  return res.data;
};

/**
 * 🔹 Met à jour un enseignant
 */
export const updateTeacher = async (id: string, teacher: Partial<Teacher>): Promise<Teacher> => {
  const res = await api.put(`/users/${id}`, teacher);
  return res.data;
};

/**
 * 🔹 Supprime un enseignant (soft delete)
 */
export const deleteTeacher = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};
