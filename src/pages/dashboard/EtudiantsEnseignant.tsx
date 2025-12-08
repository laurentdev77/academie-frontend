// frontend/src/pages/dashboard/EtudiantsEnseignant.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react"; // ✅ correction : pas "LucideRefreshCw"

const API_BASE =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";

type Filiere = { id: string; nom: string };
type Promotion = { id: string; nom: string; annee?: number; filiereId: string };
type UserInfo = { email?: string; telephone?: string };
type Student = {
  id: string;
  matricule?: string;
  nom: string;
  prenom?: string;
  sexe?: string;
  user?: UserInfo;
};

const EtudiantsEnseignant: React.FC = () => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedPromotion, setSelectedPromotion] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFilieres = async () => {
    try {
      const res = await axios.get(`${API_BASE}/filieres`, { headers });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setFilieres(data);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          "Erreur lors du chargement des filières."
      );
    }
  };

  const fetchPromotions = async (filiereId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/promotions/by-filiere/${filiereId}`, { headers });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setPromotions(data);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          "Erreur lors du chargement des promotions."
      );
    }
  };

  const fetchStudents = async (promotionId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/students/by-promotion/${promotionId}`, { headers });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setStudents(data);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          "Erreur lors du chargement des Elèves Officiers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilieres();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Liste des Elèves Officiers</CardTitle>
          <Button
  variant="outline"
  onClick={() => {
    fetchFilieres();              // recharge filières
    if (selectedFiliere)          // si une filière est déjà choisie → on recharge
      fetchPromotions(selectedFiliere);

    if (selectedPromotion)        // si une promotion est déjà choisie → on recharge
      fetchStudents(selectedPromotion);
  }}
>
  <RefreshCcw className="w-4 h-4 mr-1" /> Actualiser
</Button>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <p className="text-red-600 bg-red-50 border border-red-200 p-2 rounded mb-3">
              {errorMsg}
            </p>
          )}

          {/* === Filtres === */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Filière</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedFiliere}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedFiliere(id);
                  setSelectedPromotion("");
                  setStudents([]);
                  if (id) fetchPromotions(id);
                }}
              >
                <option value="">— Choisir une filière —</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedPromotion}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedPromotion(id);
                  if (id) fetchStudents(id);
                }}
                disabled={!selectedFiliere}
              >
                <option value="">— Choisir une promotion —</option>
                {promotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} {p.annee ? `(${p.annee})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* === Tableau des étudiants === */}
          {loading ? (
            <p>Chargement des étudiants...</p>
          ) : students.length === 0 && selectedPromotion ? (
            <p className="text-gray-500">
              Aucun Elève Officier trouvé pour cette promotion.
            </p>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto border rounded-md bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Matricule</th>
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Prénom</th>
                    <th className="px-3 py-2 text-left">Sexe</th>
                    <th className="px-3 py-2 text-left">Messagerie électronique</th>
                    <th className="px-3 py-2 text-left">Téléphone</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{s.matricule || "—"}</td>
                      <td className="px-3 py-2 font-semibold">{s.nom}</td>
                      <td className="px-3 py-2">{s.prenom || "—"}</td>
                      <td className="px-3 py-2">{s.sexe || "—"}</td>
                      <td className="px-3 py-2">{s.user?.email || "—"}</td>
                      <td className="px-3 py-2">{s.user?.telephone || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">
              Veuillez sélectionner une filière et une promotion.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EtudiantsEnseignant;
