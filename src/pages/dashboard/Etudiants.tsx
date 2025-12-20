// frontend/src/pages/dashboard/Etudiants.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  RefreshCcw,
  Plus,
  FileSpreadsheet,
  FileText,
  Eye,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type Filiere = { id: number; nom: string };
type Promotion = { id: number; nom: string; filiereId?: number };
type User = { id: string; email?: string; telephone?: string };
type Student = {
  id: string;
  matricule?: string;
  nom: string;
  prenom?: string;
  sexe?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  photoUrl?: string;
  grade?: string;
  etatDossier?: string;
  promotionId?: number | null;
  promotion?: Promotion | null;
  user?: User | null;
  createdAt?: string;
  updatedAt?: string;
};

/* API base */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* Simple Select wrapper */
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="border rounded p-2 w-full focus:ring-2 focus:ring-blue-300">
    {props.children}
  </select>
);

export default function Etudiants() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedFiliere, setSelectedFiliere] = useState<number | "">("");
  const [selectedPromotion, setSelectedPromotion] = useState<number | "">("");
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    sexe: "",
    dateNaissance: "",
    lieuNaissance: "",
    photoUrl: "",
    grade: "",
    etatDossier: "en_cours",
    filiereId: 0,
    promotionId: null as number | null,
    userId: "",
  });

  // Initial load
  useEffect(() => {
    fetchFilieres();
    fetchPromotions();
    fetchAllStudents();
  }, []);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  /* ===== Fetchers ===== */
  async function fetchFilieres() {
    try {
      const res = await axios.get(`${API_BASE}/filieres`, { headers });
      setFilieres(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (err) {
      console.error("fetchFilieres:", err);
      setErrorMsg("Impossible de charger les filières");
    }
  }

  async function fetchPromotions() {
    try {
      const res = await axios.get(`${API_BASE}/promotions`, { headers });
      setPromotions(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (err) {
      console.error("fetchPromotions:", err);
      setErrorMsg("Impossible de charger les promotions");
    }
  }

  async function fetchAllStudents() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/students`, { headers });
      setStudents(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (err) {
      console.error("fetchAllStudents:", err);
      setErrorMsg("Impossible de charger les Elèves Officiers");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudentsByPromotion(promotionId: number) {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/students/by-promotion/${promotionId}`, { headers });
      setStudents(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (err) {
      console.error("fetchStudentsByPromotion:", err);
      setErrorMsg("Impossible de charger les Elèves Officiers pour cette promotion");
    } finally {
      setLoading(false);
    }
  }

  /* ===== Filters handlers ===== */
  function onSelectFiliere(fId: string) {
    const id = fId === "" ? "" : Number(fId);
    setSelectedFiliere(id);
    setSelectedPromotion("");
    setStudents([]);
    setPage(1);

    if (id === "") {
      setFilteredPromotions([]);
      return;
    }

    const fp = promotions.filter((p) => p.filiereId === id);
    setFilteredPromotions(fp);
  }

  function onSelectPromotion(pId: string) {
    const id = pId === "" ? "" : Number(pId);
    setSelectedPromotion(id);
    setPage(1);
    if (id === "") {
      setStudents([]);
      return;
    }
    fetchStudentsByPromotion(Number(id));
  }

  /* ===== Search & Pagination ===== */
  const searchableStudents = students.filter((s) => {
    const hay = [
      s.nom || "",
      s.prenom || "",
      s.matricule || "",
      s.user?.email || "",
      s.user?.telephone || "",
      s.promotion?.nom || "",
    ].join(" ").toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(searchableStudents.length / perPage));
  const paginated = searchableStudents.slice((page - 1) * perPage, page * perPage);

  /* ===== Export helpers ===== */
  function exportToPDF() {
    const doc = new jsPDF({ unit: "pt" });
    doc.text("Liste des Elèves Officiers", 40, 40);
    const head = [["Matricule", "Nom", "Prénom", "Sexe", "Email", "Téléphone", "Date Naissance", "Promotion"]];
    const body = searchableStudents.map((s) => [
      s.matricule || "-",
      s.nom,
      s.prenom || "-",
      s.sexe || "-",
      s.user?.email || "-",
      s.user?.telephone || "-",
      s.dateNaissance ? new Date(s.dateNaissance).toLocaleDateString() : "-",
      s.promotion?.nom || "-",
    ]);
    autoTable(doc, { startY: 60, head, body, styles: { fontSize: 9 } });
    doc.save("etudiants.pdf");
  }

  function exportToExcel() {
    const rows = searchableStudents.map((s) => ({
      Matricule: s.matricule || "",
      Nom: s.nom,
      Prénom: s.prenom || "",
      Sexe: s.sexe || "",
      Email: s.user?.email || "",
      Téléphone: s.user?.telephone || "",
      "Date Naissance": s.dateNaissance ? new Date(s.dateNaissance).toLocaleDateString() : "",
      Promotion: s.promotion?.nom || "",
      "État Dossier": s.etatDossier || "",
      Grade: s.grade || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Elève Officier");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "etudiants.xlsx");
  }

  /* ===== Upload photo ===== */
  async function handlePhotoUpload(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await axios.post(`${API_BASE}/students/upload-photo`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url ?? res.data?.fileUrl ?? null;
      if (url) setForm((f) => ({ ...f, photoUrl: url }));
      setSuccessMsg(url ? "Photo téléversée avec succès" : "Aucune URL reçue après upload");
    } catch (err) {
      console.error("upload error:", err);
      setErrorMsg("Erreur lors du téléversement de la photo");
    }
  }

  /* ===== CRUD ===== */
  function openAddForm() {
    setEditing(null);
    setForm({
      matricule: "",
      nom: "",
      prenom: "",
      sexe: "",
      dateNaissance: "",
      lieuNaissance: "",
      photoUrl: "",
      grade: "",
      etatDossier: "en_cours",
      filiereId: 0,
      promotionId: null,
      userId: "",
    });
    setFilteredPromotions([]);
    setSelectedFiliere("");
    setSelectedPromotion("");
    setShowForm(true);
  }

  function openEditForm(student: Student) {
    const filiereId = student.promotion?.filiereId ?? 0;
    setEditing(student);
    setForm({
      matricule: student.matricule || "",
      nom: student.nom,
      prenom: student.prenom || "",
      sexe: student.sexe || "",
      dateNaissance: student.dateNaissance || "",
      lieuNaissance: student.lieuNaissance || "",
      photoUrl: student.photoUrl || "",
      grade: student.grade || "",
      etatDossier: student.etatDossier || "en_cours",
      filiereId,
      promotionId: student.promotionId ?? null,
      userId: student.user?.id ?? "",
    });
    const fp = promotions.filter((p) => p.filiereId === filiereId);
    setFilteredPromotions(fp);
    setShowForm(true);
  }

  async function submitForm() {
  setErrorMsg(null);

  // Validation côté frontend
  if (!form.matricule || !form.nom || !form.promotionId) {
    setErrorMsg("Matricule, Nom et Promotion sont obligatoires.");
    return;
  }

  // Préparer le payload compatible avec le backend
  const payload = {
    matricule: form.matricule,
    nom: form.nom,
    prenom: form.prenom || null,
    sexe: form.sexe || null, // doit être "M", "F" ou "Autre"
    dateNaissance: form.dateNaissance || null,
    lieuNaissance: form.lieuNaissance || null,
    photoUrl: form.photoUrl || null,
    grade: form.grade || null,
    etatDossier: form.etatDossier || "en_cours",
    promotionId: Number(form.promotionId),
    userId: form.userId ? form.userId : null, // jamais envoyer "" au backend
  };

  try {
    if (editing) {
      // Mise à jour
      await axios.put(`${API_BASE}/students/${editing.id}`, payload, { headers });
      setSuccessMsg("Elève Officier mis à jour");
    } else {
      // Création
      await axios.post(`${API_BASE}/students`, payload, { headers });
      setSuccessMsg("Elève Officier créé");
    }

    setShowForm(false);
    fetchAllStudents(); // rafraîchir la liste
  } catch (err: any) {
    console.error("submitForm error:", err);

    // Message d'erreur plus précis si backend le fournit
    setErrorMsg(err?.response?.data?.message || "Erreur lors de l'enregistrement");
  }
}

  async function deleteStudent(id: string) {
    if (!confirm("Supprimer cet Elève Officier ?")) return;
    try {
      await axios.delete(`${API_BASE}/students/${id}`, { headers });
      setSuccessMsg("Elève Officier supprimé");
      fetchAllStudents();
    } catch (err) {
      console.error("deleteStudent:", err);
      setErrorMsg("Erreur lors de la suppression");
    }
  }

  /* ===== RENDER JSX complet ===== */
  return (
    <div className="p-6 space-y-6">
      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Elèves Officiers</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF}><FileText className="mr-2" />PDF</Button>
          <Button variant="outline" onClick={exportToExcel}><FileSpreadsheet className="mr-2" />Excel</Button>
          <Button onClick={openAddForm}><Plus className="mr-2" />Ajouter</Button>
          <Button variant="outline" onClick={() => { fetchAllStudents(); fetchPromotions(); fetchFilieres(); }}><RefreshCcw className="mr-2" />Actualiser</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Filière</label>
          <Select value={selectedFiliere === "" ? "" : String(selectedFiliere)} onChange={(e) => onSelectFiliere(e.target.value)}>
            <option value="">— Toutes les filières —</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Promotion</label>
          <Select value={selectedPromotion === "" ? "" : String(selectedPromotion)} onChange={(e) => onSelectPromotion(e.target.value)} disabled={filteredPromotions.length === 0}>
            <option value="">— Choisir une promotion —</option>
            {filteredPromotions.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Recherche</label>
          <div className="flex gap-2">
            <Input placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <Button variant="ghost" onClick={() => { setSearch(""); setPage(1); }}>Clear</Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && <div className="text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded">{successMsg}</div>}
      {errorMsg && <div className="text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded">{errorMsg}</div>}

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded border shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Matricule</th>
              <th className="text-left px-3 py-2">Nom</th>
              <th className="text-left px-3 py-2">Prénom</th>
              <th className="text-left px-3 py-2">Sexe</th>
              <th className="text-left px-3 py-2">Téléphone</th>
              <th className="text-left px-3 py-2">Date naissance</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Promotion</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6 text-gray-500">
                  {loading ? "Chargement..." : "Aucun étudiant trouvé"}
                </td>
              </tr>
            ) : paginated.map((s, i) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{(page - 1) * perPage + i + 1}</td>
                <td className="px-3 py-2">{s.matricule || "—"}</td>
                <td className="px-3 py-2 font-medium">{s.nom}</td>
                <td className="px-3 py-2">{s.prenom || "—"}</td>
                <td className="px-3 py-2">{s.sexe || "—"}</td>
                <td className="px-3 py-2">{s.user?.telephone || "—"}</td>
                <td className="px-3 py-2">{s.dateNaissance ? new Date(s.dateNaissance).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2">{s.user?.email || "—"}</td>
                <td className="px-3 py-2">{s.promotion?.nom || "—"}</td>
                <td className="px-3 py-2 flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => openEditForm(s)}><Pencil size={14} /></Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteStudent(s.id)}><Trash2 size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowDetails(s)}><Eye size={14} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center items-center mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button>
          <span>Page {page} / {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      )}

      {/* Formulaire Add/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-20 z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{editing ? "Modifier" : "Ajouter"} un Elève Officier</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Matricule" value={form.matricule} onChange={(e) => setForm({...form, matricule: e.target.value})} />
              <Input placeholder="Nom" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} />
              <Input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({...form, prenom: e.target.value})} />
              <Input placeholder="Grade" value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} />
              <Select value={form.sexe} onChange={(e) => setForm({...form, sexe: e.target.value})}>
                <option value="">— Sexe —</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </Select>
              <Input type="date" placeholder="Date naissance" value={form.dateNaissance} onChange={(e) => setForm({...form, dateNaissance: e.target.value})} />
              <Input placeholder="Lieu naissance" value={form.lieuNaissance} onChange={(e) => setForm({...form, lieuNaissance: e.target.value})} />
              <Select value={form.filiereId} onChange={(e) => {
                const fid = Number(e.target.value);
                setForm({...form, filiereId: fid, promotionId: null});
                setFilteredPromotions(promotions.filter(p => p.filiereId === fid));
              }}>
                <option value={0}>— Filière —</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </Select>
              <Select value={form.promotionId || ""} onChange={(e) => setForm({...form, promotionId: e.target.value ? Number(e.target.value) : null})}>
                <option value="">— Promotion —</option>
                {filteredPromotions.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </Select>
              <Input type="file" onChange={handlePhotoUpload} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button onClick={submitForm}>{editing ? "Modifier" : "Ajouter"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Détails */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-20 z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Détails</h2>
            <ul className="space-y-2">
              <li><strong>Matricule:</strong> {showDetails.matricule}</li>
              <li><strong>Nom:</strong> {showDetails.nom}</li>
              <li><strong>Prénom:</strong> {showDetails.prenom}</li>
              <li><strong>Sexe:</strong> {showDetails.sexe}</li>
              <li><strong>Email:</strong> {showDetails.user?.email}</li>
              <li><strong>Téléphone:</strong> {showDetails.user?.telephone}</li>
              <li><strong>Date Naissance:</strong> {showDetails.dateNaissance ? new Date(showDetails.dateNaissance).toLocaleDateString() : "—"}</li>
              <li><strong>Promotion:</strong> {showDetails.promotion?.nom}</li>
              <li><strong>Grade:</strong> {showDetails.grade}</li>
              <li><strong>État dossier:</strong> {showDetails.etatDossier}</li>
            </ul>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowDetails(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
