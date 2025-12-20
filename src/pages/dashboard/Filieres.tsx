// frontend/src/pages/dashboard/FilieresPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
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
import { Plus, Edit, Trash2, RefreshCcw } from "lucide-react"; // ✅ version correcte

interface Filiere {
  id: number;
  nom: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FilieresPage: React.FC = () => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Filiere | null>(null);
  const [form, setForm] = useState({ nom: "", description: "" });

  useEffect(() => {
    fetchFilieres();
  }, []);

  const fetchFilieres = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.get(`${API_BASE}/filieres`, { headers });
      const data =
        Array.isArray(res.data)
          ? res.data
          : res.data?.data ||
            res.data?.filieres ||
            res.data?.rows ||
            [];
      setFilieres(data);
    } catch (err: any) {
      console.error("fetchFilieres error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur chargement filières");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: "", description: "" });
    setOpenForm(true);
  };

  const openEdit = (f: Filiere) => {
    setEditing(f);
    setForm({ nom: f.nom, description: f.description || "" });
    setOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!form.nom || form.nom.trim().length < 2) {
      setErrorMsg("Le nom de la filière est requis (≥2 caractères).");
      return;
    }

    const payload = {
      nom: form.nom.trim(),
      description: form.description?.trim() || "",
    };

    try {
      if (editing) {
        await axios.put(`${API_BASE}/filieres/${editing.id}`, payload, { headers });
        setSuccessMsg("Filière mise à jour.");
      } else {
        await axios.post(`${API_BASE}/filieres`, payload, { headers });
        setSuccessMsg("Filière ajoutée.");
      }

      await fetchFilieres();
      setForm({ nom: "", description: "" });
      setEditing(null);
      requestAnimationFrame(() => setTimeout(() => setOpenForm(false), 100));
    } catch (err: any) {
      console.error("save filiere error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cette filière ?")) return;
    try {
      await axios.delete(`${API_BASE}/filieres/${id}`, { headers });
      setSuccessMsg("Filière supprimée.");
      fetchFilieres();
    } catch (err: any) {
      console.error("delete filiere error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur suppression filière");
    }
  };

  const filtered = filieres.filter((f) =>
    `${f.nom} ${f.description ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl">Gestion des Filières</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher filière..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={fetchFilieres} variant="outline">
              <RefreshCcw className="w-4 h-4 mr-1" /> Actualiser
            </Button>
            <Button onClick={openCreate} className="bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
          {successMsg && <p className="text-green-600 mb-2">{successMsg}</p>}

          {loading ? (
            <p>Chargement...</p>
          ) : filtered.length === 0 ? (
            <p>Aucune filière trouvée.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-md border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left">Créée le</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, index) => (
                    <tr key={f.id ?? `filiere-${index}`} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{f.nom}</td>
                      <td className="px-3 py-2">{f.description || "—"}</td>
                      <td className="px-3 py-2">
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-center flex justify-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(f)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(f.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        key={editing ? `edit-${editing.id}` : "new"}
        open={openForm}
        onOpenChange={setOpenForm}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la filière" : "Ajouter une filière"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm">Nom</label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              />
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
              <Button type="submit">{editing ? "Modifier" : "Enregistrer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilieresPage;
