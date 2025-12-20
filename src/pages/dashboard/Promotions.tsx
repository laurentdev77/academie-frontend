// src/pages/dashboard/Promotions.tsx
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
import { LucidePlus, LucideEdit, LucideTrash2, LucideRefreshCw } from "lucide-react";

// 🌐 Définir l'URL du backend dynamiquement
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Filiere {
  id: number;
  nom: string;
}

interface Promotion {
  id: number;
  nom: string;
  annee: number;
  filiereId?: number | null;
  filiere?: Filiere | null;
}

const PromotionsPage: React.FC = () => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({ nom: "", annee: new Date().getFullYear(), filiereId: null as number | null });

  useEffect(() => {
    fetchFilieres();
    fetchPromotions();
  }, []);

  const fetchFilieres = async () => {
    try {
      const res = await axios.get(`${API}/filieres`, { headers });
      setFilieres(res.data || []);
    } catch (err) {
      console.error("Erreur chargement filières:", err);
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.get(`${API}/promotions`, { headers });
      const data = Array.isArray(res.data) ? res.data : [];
      setPromotions(data);
    } catch (err: any) {
      console.error("fetchPromotions error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur lors du chargement des promotions");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: "", annee: new Date().getFullYear(), filiereId: null });
    setOpenForm(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditing(promo);
    setForm({
      nom: promo.nom,
      annee: promo.annee,
      filiereId: promo.filiereId ?? null,
    });
    setOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!form.nom.trim()) return setErrorMsg("Le nom est requis");
    if (!form.annee) return setErrorMsg("L’année est requise");

    try {
      if (editing) {
        await axios.put(`${API}/promotions/${editing.id}`, form, { headers });
        setSuccessMsg("Promotion mise à jour");
      } else {
        await axios.post(`${API}/promotions`, form, { headers });
        setSuccessMsg("Promotion ajoutée");
      }
      setOpenForm(false);
      fetchPromotions();
    } catch (err: any) {
      console.error("save promotion error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur lors de l’enregistrement");
    }
  };

  // 🔄 Efface automatiquement les messages après 3 secondes
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
    if (!window.confirm("Supprimer cette promotion ?")) return;
    try {
      await axios.delete(`${API}/promotions/${id}`, { headers });
      setSuccessMsg("Promotion supprimée");
      fetchPromotions();
    } catch (err: any) {
      console.error("delete promotion error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const filtered = promotions.filter((p) =>
    `${p.nom} ${p.annee} ${p.filiere?.nom ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl">Gestion des Promotions</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher promotion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={fetchPromotions} variant="outline">
              <LucideRefreshCw className="w-4 h-4 mr-1" /> Actualiser
            </Button>
            <Button onClick={openCreate} className="bg-blue-600 text-white">
              <LucidePlus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
          {successMsg && <p className="text-green-600 mb-2">{successMsg}</p>}

          {loading ? (
            <p>Chargement...</p>
          ) : filtered.length === 0 ? (
            <p>Aucune promotion trouvée.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-md border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Année</th>
                    <th className="px-3 py-2 text-left">Filière</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{p.nom}</td>
                      <td className="px-3 py-2">{p.annee}</td>
                      <td className="px-3 py-2">{p.filiere?.nom || "-"}</td>
                      <td className="px-3 py-2 text-center flex justify-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <LucideEdit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                          <LucideTrash2 className="w-4 h-4" />
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

      {/* 🧾 FORM MODAL */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la promotion" : "Ajouter une promotion"}</DialogTitle>
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
              <label className="block text-sm">Année</label>
              <Input
                type="number"
                value={form.annee}
                onChange={(e) => setForm({ ...form, annee: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm">Filière</label>
              <select
                className="border rounded px-2 py-2 w-full"
                value={form.filiereId ?? ""}
                onChange={(e) =>
                  setForm({ ...form, filiereId: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">-- Choisir une filière --</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
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

export default PromotionsPage;
