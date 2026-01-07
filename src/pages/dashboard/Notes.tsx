// src/pages/dashboard/Notes.tsx
import React, { useEffect, useState } from "react";
import api from "@/utils/axiosConfig";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucideEdit, LucideTrash2, LucideRefreshCw, LucideDownload } from "lucide-react";

// ------------------ Types ------------------
interface Filiere { id: number; nom: string; }
interface Promotion { id: number; nom?: string; annee?: number; filiereId?: number | null; filiere?: Filiere | null; }
interface ModuleType {
  id: string;
  nom?: string;
  title?: string;
  code?: string;
  promotionId?: number | null;
  promotion?: Promotion | null;
  semester?: number; // ✅ ajouté
}
interface Student { id: string; matricule?: string; nom: string; prenom?: string; promotionId?: number | null; promotion?: Promotion | null; }
interface NoteItem {
  id: string;
  studentId: string;
  moduleId: string;
  ce?: number | null;
  fe?: number | null;
  score?: number | null;
  session?: string;
  semester?: number;
  appreciation?: string | null;
  student?: Student | null;
  module?: ModuleType | null;
}

// ------------------ Composant ------------------
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="border rounded px-2 py-2 w-full">
    {props.children}
  </select>
);

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [promotionId, setPromotionId] = useState<string | "all">("all");
  const [moduleId, setModuleId] = useState<string | "all">("all");
  const [session, setSession] = useState<string | "all">("all");
  const [semester, setSemester] = useState<string | "">("");

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [form, setForm] = useState({
    studentId: "",
    moduleId: "",
    ce: "",
    fe: "",
    session: "Normale",
    semester: "1",
    appreciation: "",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ------------------ Fetch ------------------
  useEffect(() => {
    fetchAllStatic();
    fetchNotes();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchNotes(), 300);
    return () => clearTimeout(t);
  }, [search, promotionId, moduleId, session, semester]);

  const fetchAllStatic = async () => {
    try {
      const [mRes, sRes, pRes, fRes] = await Promise.all([
        api.get("/modules/my"), // ✅ modules de l'enseignant
        api.get("/students"),
        api.get("/promotions"),
        api.get("/filieres"),
      ]);

      setModules(Array.isArray(mRes.data?.data) ? mRes.data.data : []);
      setStudents(Array.isArray(sRes.data?.data) ? sRes.data.data : []);
      setPromotions(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
      setFilieres(Array.isArray(fRes.data?.data) ? fRes.data.data : []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Impossible de charger les données statiques.");
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (promotionId !== "all") params.promotionId = promotionId;
      if (moduleId !== "all") params.moduleId = moduleId;
      if (session !== "all") params.session = session;
      if (semester) params.semester = semester;

      const res = await api.get("/notes", { params });
      const data: NoteItem[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotes(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || "Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Form logic ------------------
  const openAddForm = () => {
    setEditingNote(null);
    const firstModule = modules[0];
    const firstStudent = studentsForSelectedModule(firstModule?.id)[0];
    setForm({
      studentId: firstStudent?.id ?? "",
      moduleId: firstModule?.id ?? "",
      ce: "",
      fe: "",
      session: "Normale",
      semester: firstModule?.semester ? String(firstModule.semester) : "1",
      appreciation: "",
    });
    setShowForm(true);
  };

  const openEditForm = (n: NoteItem) => {
    setEditingNote(n);
    setForm({
      studentId: n.studentId,
      moduleId: n.moduleId,
      ce: n.ce !== undefined && n.ce !== null ? String(n.ce) : "",
      fe: n.fe !== undefined && n.fe !== null ? String(n.fe) : "",
      session: n.session ?? "Normale",
      semester: n.semester ? String(n.semester) : "1",
      appreciation: n.appreciation ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const payload = {
      studentId: form.studentId,
      moduleId: form.moduleId,
      ce: form.ce === "" ? 0 : parseFloat(form.ce),
      fe: form.fe === "" ? 0 : parseFloat(form.fe),
      session: form.session,
      semester: parseInt(form.semester || "1", 10),
      appreciation: form.appreciation,
    };
    try {
      if (editingNote) await api.put(`/notes/${editingNote.id}`, payload);
      else await api.post("/notes", payload);
      setShowForm(false);
      fetchNotes();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const deleteNote = async (id: string) => {
    if (!window.confirm("Supprimer cette note ?")) return;
    try {
      await api.delete(`/notes/${id}`);
      setSuccessMsg("Note supprimée");
      fetchNotes();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors de la suppression de la note");
    }
  };

  // ------------------ Helper functions ------------------
  const moduleLabel = (m?: ModuleType | null) => m ? m.nom ?? m.title ?? m.code ?? m.id : "-";

  // Filtrer les étudiants selon la promotion du module choisi
  const studentsForSelectedModule = (modId?: string) => {
    const mod = modules.find((m) => m.id === modId || m.id === moduleId);
    if (!mod?.promotionId) return [];
    return students.filter((s) => s.promotionId === mod.promotionId);
  };

  const filiereNameFromNote = (n: NoteItem) => {
    const promotion = n.student?.promotion ?? promotions.find((p) => p.id === n.student?.promotionId);
    const fil = filieres.find((f) => f.id === promotion?.filiereId);
    return fil?.nom ?? "-";
  };

  // ------------------ Excel export ------------------
  const exportToExcel = () => {
    const data = notes.map((n: NoteItem) => {
      const stud = n.student;
      const mod = n.module;
      const promotion = stud?.promotion ?? promotions.find((p) => p.id === stud?.promotionId);
      const filiere = filieres.find((f) => f.id === promotion?.filiereId);

      return {
        Étudiant: `${stud?.nom ?? ""} ${stud?.prenom ?? ""}`.trim(),
        Matricule: stud?.matricule ?? "",
        Filière: filiere?.nom ?? "-",
        Promotion: promotion?.nom ?? "-",
        Module: moduleLabel(mod),
        CE: n.ce ?? "",
        FE: n.fe ?? "",
        Score: n.score ?? "",
        Session: n.session ?? "",
        Semestre: n.semester ?? "",
        Appréciation: n.appreciation ?? "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `notes_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ------------------ Render ------------------
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notes des Elèves Officiers</h2>
        <div className="flex gap-2">
          <Button onClick={openAddForm}>Ajouter une note</Button>
          <Button onClick={fetchNotes} variant="outline">
            <LucideRefreshCw className="w-4 h-4 mr-1" /> Actualiser
          </Button>
          <Button onClick={exportToExcel} variant="ghost">
            <LucideDownload className="w-4 h-4 mr-1" /> Exporter Excel
          </Button>
        </div>
      </div>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      {successMsg && <p className="text-green-600">{successMsg}</p>}

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded border">
        <table className="min-w-full text-sm text-center border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 border">Elève Officier</th>
              <th className="px-2 py-1 border">Matricule</th>
              <th className="px-2 py-1 border">Filière</th>
              <th className="px-2 py-1 border">Promotion</th>
              <th className="px-2 py-1 border">Module</th>
              <th className="px-2 py-1 border">CE (40%)</th>
              <th className="px-2 py-1 border">FE (60%)</th>
              <th className="px-2 py-1 border">Score</th>
              <th className="px-2 py-1 border">Appréciation</th>
              <th className="px-2 py-1 border">Session</th>
              <th className="px-2 py-1 border">Semestre</th>
              <th className="px-2 py-1 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="py-4">Chargement...</td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={12} className="py-4 text-gray-500">Aucune note trouvée</td></tr>
            ) : (
              notes.map((n: NoteItem) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1">{n.student?.nom} {n.student?.prenom}</td>
                  <td className="px-2 py-1">{n.student?.matricule ?? "-"}</td>
                  <td className="px-2 py-1">{filiereNameFromNote(n)}</td>
                  <td className="px-2 py-1">{n.student?.promotion?.nom ?? "-"}</td>
                  <td className="px-2 py-1">{moduleLabel(n.module)}</td>
                  <td className="px-2 py-1">{n.ce ?? "-"}</td>
                  <td className="px-2 py-1">{n.fe ?? "-"}</td>
                  <td className="px-2 py-1">{n.score ?? "-"}</td>
                  <td className="px-2 py-1">{n.appreciation ?? "-"}</td>
                  <td className="px-2 py-1">{n.session ?? "-"}</td>
                  <td className="px-2 py-1">{n.semester ?? "-"}</td>
                  <td className="px-2 py-1 flex gap-2 justify-center">
                    <Button size="sm" onClick={() => openEditForm(n)}><LucideEdit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteNote(n.id)}><LucideTrash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg space-y-3">
            <h3 className="text-lg font-semibold">{editingNote ? "Modifier Note" : "Ajouter Note"}</h3>

            <Select
              value={form.moduleId}
              onChange={(e) => setForm({ ...form, moduleId: e.target.value, studentId: studentsForSelectedModule(e.target.value)[0]?.id ?? "" })}
            >
              {modules.map((m: ModuleType) => (
                <option key={m.id} value={m.id}>{moduleLabel(m)}</option>
              ))}
            </Select>

            <Select
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            >
              {studentsForSelectedModule(form.moduleId).map((s: Student) => (
                <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>
              ))}
            </Select>

            <Input type="number" placeholder="CE" value={form.ce} onChange={(e) => setForm({ ...form, ce: e.target.value })} />
            <Input type="number" placeholder="FE" value={form.fe} onChange={(e) => setForm({ ...form, fe: e.target.value })} />

            <Select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}>
              <option value="Normale">Normale</option>
              <option value="Rattrapage">Rattrapage</option>
            </Select>

            <Select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </Select>

            <Input placeholder="Appréciation" value={form.appreciation} onChange={(e) => setForm({ ...form, appreciation: e.target.value })} />

            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>{editingNote ? "Modifier" : "Ajouter"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
