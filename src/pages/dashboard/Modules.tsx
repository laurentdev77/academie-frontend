// src/pages/dashboard/Modules.tsx
import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
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
import { LucidePlus, LucideEdit, LucideTrash2, LucideRefreshCw } from "lucide-react";

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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ModulesPage: React.FC = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role")?.toLowerCase(); // 🔥 RÉCUPÉRATION DU RÔLE

  // 🔥 DROITS D’ACCÈS
  const canManage = role === "admin" || role === "secretary"; // CRUD
  const canView = role === "admin" || role === "secretary" || role === "de"; // Lecture seule

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

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

  /* ============================================================
     🔥 BLOQUER L’ACCÈS POUR LES TEACHERS
     ============================================================ */
  if (!canView) {
    return (
      <div className="p-6 text-center text-red-600 text-xl font-semibold">
        Accès refusé — Vous n’êtes pas autorisé à consulter cette page.
      </div>
    );
  }

  /* ============================================================
     🔹 CHARGEMENT INITIAL
     ============================================================ */
  useEffect(() => {
    fetchModules();
    fetchFilieres();
    fetchTeachers();
  }, []);

  /* ============================================================
     🔹 CHARGER LES MODULES
     ============================================================ */
  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/modules`, { headers });
      const data = Array.isArray(res.data.data)
        ? res.data.data
        : res.data.data || [];
      setModules(data);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 403) {
        setErrorMsg("Accès refusé : vous n’êtes pas autorisé à consulter ces données.");
      } else {
        setErrorMsg(error.response?.data?.message || "Erreur lors du chargement des modules.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     🔹 CHARGER LES FILIÈRES
     ============================================================ */
  const fetchFilieres = async () => {
    try {
      const res = await axios.get(`${API_BASE}/filieres`, { headers });
      setFilieres(res.data || []);
    } catch (err) {
      console.error("Erreur filières :", err);
    }
  };

  /* ============================================================
     🔹 CHARGER LES PROMOTIONS PAR FILIÈRE
     ============================================================ */
  const fetchPromotions = async (filiereId: number) => {
    if (!filiereId) return setPromotions([]);
    try {
      const res = await axios.get(`${API_BASE}/promotions?filiereId=${filiereId}`, { headers });
      setPromotions(res.data || []);
    } catch (err) {
      console.error("Erreur promotions :", err);
    }
  };

  /* ============================================================
     🔹 CHARGER LES ENSEIGNANTS
     ============================================================ */
  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users/teachers`, { headers });
      setTeachers(res.data || []);
    } catch (err) {
      console.error("Erreur enseignants :", err);
    }
  };

  /* ============================================================
     🔹 OUVRIR LE FORMULAIRE
     ============================================================ */
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

  /* ============================================================
     🔹 AJOUT / MODIFICATION
     ============================================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      const payload = { ...form };
      if (editingModule) {
        await axios.put(`${API_BASE}/modules/${editingModule.id}`, payload, { headers });
        setSuccessMsg("Module mis à jour avec succès !");
      } else {
        await axios.post(`${API_BASE}/modules`, payload, { headers });
        setSuccessMsg("Module ajouté avec succès !");
      }
      setOpenForm(false);
      fetchModules();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setErrorMsg(error.response?.data?.message || "Erreur lors de l’enregistrement du module.");
    }
  };

  /* ============================================================
     🔹 SUPPRESSION
     ============================================================ */
  const handleDelete = async (id: string) => {
    if (!canManage) return;
    if (!window.confirm("Supprimer ce module ?")) return;

    try {
      await axios.delete(`${API_BASE}/modules/${id}`, { headers });
      setSuccessMsg("Module supprimé avec succès !");
      fetchModules();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setErrorMsg(error.response?.data?.message || "Erreur lors de la suppression.");
    }
  };

  /* ============================================================
     🔹 RECHERCHE
     ============================================================ */
  const filtered = modules.filter((m) =>
    `${m.title} ${m.code}`.toLowerCase().includes(search.toLowerCase())
  );

  /* ============================================================
     🔹 AFFICHAGE PAGE
     ============================================================ */
  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl">Gestion des Modules (Cours)</CardTitle>

          <div className="flex gap-2">
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />

            <Button onClick={fetchModules} variant="outline">
              <LucideRefreshCw className="w-4 h-4 mr-1" /> Actualiser
            </Button>

            {canManage && (
              <Button onClick={openCreate} className="bg-blue-600 text-white">
                <LucidePlus className="w-4 h-4 mr-1" /> Ajouter
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
          {successMsg && <p className="text-green-600 mb-2">{successMsg}</p>}

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="overflow-x-auto border rounded-md bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Titre</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-center">Crédits</th>
                    <th className="px-3 py-2 text-center">Semestre</th>
                    <th className="px-3 py-2 text-left">Filière</th>
                    <th className="px-3 py-2 text-left">Enseignant</th>
                    {canManage && <th className="px-3 py-2 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-gray-500">
                        Aucun module trouvé.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => (
                      <tr key={m.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{m.title}</td>
                        <td className="px-3 py-2">{m.code}</td>
                        <td className="px-3 py-2 text-center">{m.credits}</td>
                        <td className="px-3 py-2 text-center">S{m.semester}</td>
                        <td className="px-3 py-2">
                          {filieres.find((f) => f.id === m.filiereId)?.nom ?? "—"}
                        </td>
                        <td className="px-3 py-2">{m.teacher?.username ?? "—"}</td>

                        {canManage && (
                          <td className="px-3 py-2 flex justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                              <LucideEdit className="w-4 h-4" />
                            </Button>

                            <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>
                              <LucideTrash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======================================================
           FORMULAIRE AJOUT / MODIFICATION
         ====================================================== */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Modifier le module" : "Ajouter un module"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm">Titre</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm">Code</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm">Crédits</label>
                <Input
                  type="number"
                  min="0"
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm">Semestre</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                  className="border rounded px-2 py-2 w-full"
                >
                  <option value={1}>Semestre 1</option>
                  <option value={2}>Semestre 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm">Filière</label>
              <select
                value={form.filiereId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setForm({ ...form, filiereId: id, promotionId: 0 });
                  fetchPromotions(id);
                }}
                className="border rounded px-2 py-2 w-full"
                required
              >
                <option value={0}>-- Sélectionner une filière --</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm">Promotion</label>
              <select
                value={form.promotionId}
                onChange={(e) => setForm({ ...form, promotionId: Number(e.target.value) })}
                className="border rounded px-2 py-2 w-full"
                required
              >
                <option value={0}>-- Sélectionner une promotion --</option>
                {promotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm">Enseignant</label>
              <select
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                className="border rounded px-2 py-2 w-full"
              >
                <option value="">-- Aucun enseignant --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border rounded px-2 py-2 w-full"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                Annuler
              </Button>

              {canManage && (
                <Button type="submit">
                  {editingModule ? "Modifier" : "Enregistrer"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModulesPage;
