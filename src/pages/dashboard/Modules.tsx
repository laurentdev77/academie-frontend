import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, RefreshCcw } from "lucide-react";

interface Filiere {
  id: number;
  nom: string;
}

interface Promotion {
  id: number;
  nom: string;
  filiereId: number;
}

interface Teacher {
  id: string;
  username: string;
  email: string;
}

interface Module {
  id: string;
  title: string;
  code: string;
  description?: string;
  credits: number;
  semester: number;
  filiereId?: number;
  promotionId?: number;
  teacherId?: string | null;
  teacher?: { username: string };
}

interface ApiError {
  message?: string;
}

const ModulesPage: React.FC = () => {
  const role = localStorage.getItem("role")?.toLowerCase();

  // 🔐 Droits
  const canManage = role === "admin" || role === "secretary";
  const canView = canManage || role === "de";

  const [modules, setModules] = useState<Module[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [form, setForm] = useState({
    title: "",
    code: "",
    description: "",
    credits: 0,
    semester: 1,
    filiereId: 0,
    promotionId: 0,
    teacherId: "",
  });

  // 🚫 Accès refusé
  if (!canView) {
    return (
      <div className="p-6 text-center text-red-600 text-xl font-semibold">
        Accès refusé — Vous n’êtes pas autorisé à consulter cette page.
      </div>
    );
  }

  useEffect(() => {
    fetchModules();
    fetchFilieres();
    fetchTeachers();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await api.get("/modules");
      setModules(res.data?.data || res.data || []);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setErrorMsg(error.response?.data?.message || "Erreur chargement modules.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilieres = async () => {
    try {
      const res = await api.get("/filieres");
      setFilieres(res.data || []);
    } catch (err) {
      console.error("Erreur filières :", err);
    }
  };

  const fetchPromotions = async (filiereId: number) => {
    if (!filiereId) return setPromotions([]);
    try {
      const res = await api.get(`/promotions?filiereId=${filiereId}`);
      setPromotions(res.data || []);
    } catch (err) {
      console.error("Erreur promotions :", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/users/teachers");
      setTeachers(res.data || []);
    } catch (err) {
      console.error("Erreur enseignants :", err);
    }
  };

  const openCreate = () => {
    if (!canManage) return;
    setEditingModule(null);
    setForm({
      title: "",
      code: "",
      description: "",
      credits: 0,
      semester: 1,
      filiereId: 0,
      promotionId: 0,
      teacherId: "",
    });
    setOpenForm(true);
  };

  const openEdit = (m: Module) => {
    if (!canManage) return;
    setEditingModule(m);
    setForm({
      title: m.title,
      code: m.code,
      description: m.description || "",
      credits: m.credits,
      semester: m.semester,
      filiereId: m.filiereId || 0,
      promotionId: m.promotionId || 0,
      teacherId: m.teacherId || "",
    });
    if (m.filiereId) fetchPromotions(m.filiereId);
    setOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      if (editingModule) {
        await api.put(`/modules/${editingModule.id}`, form);
        setSuccessMsg("Module mis à jour avec succès !");
      } else {
        await api.post("/modules", form);
        setSuccessMsg("Module ajouté avec succès !");
      }
      setOpenForm(false);
      fetchModules();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setErrorMsg(error.response?.data?.message || "Erreur enregistrement module.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    if (!window.confirm("Supprimer ce module ?")) return;

    try {
      await api.delete(`/modules/${id}`);
      setSuccessMsg("Module supprimé !");
      fetchModules();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setErrorMsg(error.response?.data?.message || "Erreur suppression module.");
    }
  };

  const filtered = modules.filter((m) =>
    `${m.title} ${m.code}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl">Gestion des Modules</CardTitle>

          <div className="flex gap-2">
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />

            <Button onClick={fetchModules} variant="outline">
              <RefreshCcw className="w-4 h-4 mr-1" /> Actualiser
            </Button>

            {canManage && (
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" /> Ajouter
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {errorMsg && <p className="text-red-600">{errorMsg}</p>}
          {successMsg && <p className="text-green-600">{successMsg}</p>}

          {/* TABLE identique à la tienne */}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModulesPage;
