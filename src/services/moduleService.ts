// ✅ src/services/moduleService.ts
import api from "./api"; // ✅ chemin corrigé

export interface Teacher {
  id: string;
  username: string;
  email: string;
}

export interface Module {
  id: string;
  title: string;
  code: string;
  description?: string;
  credits: number;
  teacherId?: string | null;
  teacher?: Teacher | null;
  createdAt?: string;
  updatedAt?: string;
}

// 🔹 Récupérer tous les modules
export const fetchModules = async (): Promise<Module[]> => {
  const res = await api.get("/modules");
  return res.data;
};

// 🔹 Créer un module
export const createModule = async (module: Omit<Module, "id">): Promise<Module> => {
  const res = await api.post("/modules", module);
  return res.data;
};

// 🔹 Mettre à jour un module
export const updateModule = async (id: string, module: Partial<Module>): Promise<Module> => {
  const res = await api.put(`/modules/${id}`, module);
  return res.data;
};

// 🔹 Supprimer un module
export const deleteModule = async (id: string): Promise<void> => {
  await api.delete(`/modules/${id}`);
};
