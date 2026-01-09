// src/pages/dashboard/Notes.tsx
import React, { useEffect, useState } from "react";
import api from "@/services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucideEdit, LucideTrash2, LucideRefreshCw, LucideDownload } from "lucide-react";

// -----------------------------
// Types
// -----------------------------
interface Filiere { id: number; nom: string; }
interface Promotion { id: number; nom?: string; annee?: number; filiereId?: number | null; filiere?: Filiere | null; }
interface ModuleType { id: string; nom?: string; title?: string; code?: string; promotionId?: number | null; promotion?: Promotion | null; teacherId?: string; }
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

// -----------------------------
// Custom Select
// -----------------------------
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="border rounded px-2 py-2 w-full">{props.children}</select>
);

// -----------------------------
// Composant Notes
// -----------------------------
const Notes: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = ["admin", "secretary", "DE"].includes(user?.role?.name);
  const isTeacher = user?.role?.name === "teacher";

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

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    if (!isAdmin && !isTeacher) return;
    fetchStaticData();
    fetchNotes();
  }, []);

  useEffect(() => {
    if (!isAdmin && !isTeacher) return;
    const t = setTimeout(() => fetchNotes(), 300);
    return () => clearTimeout(t);
  }, [search, promotionId, moduleId, session, semester]);

  // -----------------------------
  // FETCH STATIC DATA
  // -----------------------------
  const fetchStaticData = async () => {
    try {
      if (isAdmin) {
        const [mRes, sRes, pRes, fRes] = await Promise.all([
          api.get("/modules"),
          api.get("/students"),
          api.get("/promotions"),
          api.get("/filieres"),
        ]);
        setModules(mRes.data || []);
        setStudents(sRes.data || []);
        setPromotions(pRes.data || []);
        setFilieres(fRes.data || []);
      } else if (isTeacher) {
        const mRes = await api.get("/notes/my-modules"); // API dédiée teacher
        setModules(mRes.data || []);

        // Récupérer tous les étudiants des modules du teacher
        const studentsSet = new Map<string, Student>();
        for (const m of mRes.data) {
          const sRes = await api.get(`/students/by-module/${m.id}`);
          (sRes.data || []).forEach((s: Student) => studentsSet.set(s.id, s));
        }
        setStudents(Array.from(studentsSet.values()));
      }
    } catch (err) {
      console.error("fetchStaticData error:", err);
      setErrorMsg("Impossible de charger les données statiques.");
    }
  };

  // -----------------------------
  // FETCH NOTES
  // -----------------------------
  const fetchNotes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let res;
      if (isTeacher) {
        res = moduleId !== "all"
          ? await api.get(`/notes/module/${moduleId}`)
          : await api.get("/notes/my");
      } else {
        const params: any = {};
        if (search) params.search = search;
        if (promotionId !== "all") params.promotionId = promotionId;
        if (moduleId !== "all") params.moduleId = moduleId;
        if (session !== "all") params.session = session;
        if (semester) params.semester = semester;
        res = await api.get("/notes", { params });
      }
      setNotes(res.data?.data || []);
    } catch (err: any) {
      console.error("fetchNotes error:", err);
      setErrorMsg(err?.response?.data?.message || "Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // FORM HANDLERS
  // -----------------------------
  const openAddForm = () => {
    if (!students.length || !modules.length) {
      setErrorMsg("Aucun étudiant ou module disponible.");
      return;
    }
    setEditingNote(null);
    setForm({
      studentId: students[0].id,
      moduleId: modules[0].id,
      ce: "",
      fe: "",
      session: "Normale",
      semester: "1",
      appreciation: "",
    });
    setShowForm(true);
  };

  const openEditForm = (note: NoteItem) => {
    setEditingNote(note);
    setForm({
      studentId: note.studentId,
      moduleId: note.moduleId,
      ce: note.ce?.toString() || "",
      fe: note.fe?.toString() || "",
      session: note.session || "Normale",
      semester: note.semester?.toString() || "1",
      appreciation: note.appreciation || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const payload = {
      studentId: form.studentId,
      moduleId: form.moduleId,
      ce: parseFloat(form.ce) || 0,
      fe: parseFloat(form.fe) || 0,
      session: form.session,
      semester: parseInt(form.semester || "1", 10),
      appreciation: form.appreciation,
    };
    try {
      if (editingNote) {
        if (isTeacher)
          await api.put(`/notes/module/${editingNote.moduleId}/${editingNote.id}`, payload);
        else
          await api.put(`/notes/${editingNote.id}`, payload);
        setSuccessMsg("Note mise à jour");
      } else {
        if (isTeacher)
          await api.post(`/notes/module/${payload.moduleId}`, payload);
        else
          await api.post("/notes", payload);
        setSuccessMsg("Note ajoutée");
      }
      setShowForm(false);
      fetchNotes();
    } catch (err: any) {
      console.error("submit note error:", err);
      setErrorMsg(err?.response?.data?.message || "Erreur lors de l'enregistrement de la note");
    }
  };

  const deleteNote = async (id: string, moduleId?: string) => {
    if (!window.confirm("Supprimer cette note ?")) return;
    try {
      if (isTeacher && moduleId)
        await api.delete(`/notes/module/${moduleId}/${id}`);
      else
        await api.delete(`/notes/${id}`);
      setSuccessMsg("Note supprimée");
      fetchNotes();
    } catch (err) {
      console.error("delete note error:", err);
      setErrorMsg("Erreur lors de la suppression de la note");
    }
  };

  // -----------------------------
  // EXPORT EXCEL
  // -----------------------------
  const exportToExcel = () => {
    const data = notes.map(n => ({
      Étudiant: `${n.student?.nom ?? ""} ${n.student?.prenom ?? ""}`.trim(),
      Matricule: n.student?.matricule ?? "",
      Filière: n.student?.promotion?.filiere?.nom ?? "-",
      Promotion: n.student?.promotion?.nom ?? "-",
      Module: n.module?.title ?? n.module?.nom ?? n.module?.code ?? n.module?.id,
      CE: n.ce ?? "",
      FE: n.fe ?? "",
      Score: n.score ?? "",
      Session: n.session ?? "",
      Semestre: n.semester ?? "",
      Appréciation: n.appreciation ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `notes_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const moduleLabel = (m?: ModuleType | null) => (m ? m.nom ?? m.title ?? m.code ?? m.id : "-");

  // -----------------------------
  // RENDER
  // -----------------------------
  if (!isAdmin && !isTeacher) {
    return (
      <div className="p-6 text-red-600">
        Accès réservé aux enseignants et à l’administration
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notes des Élèves Officiers</h2>
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

      {/* ERROR / SUCCESS */}
      {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      {successMsg && <p className="text-green-600">{successMsg}</p>}

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <Input placeholder="Recherche..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={promotionId} onChange={(e) => setPromotionId(e.target.value)}>
          <option value="all">Toutes promotions</option>
          {promotions.map(p => <option key={p.id} value={String(p.id)}>{p.nom ?? `Promotion ${p.id}`}</option>)}
        </Select>
        <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          <option value="all">Tous modules</option>
          {modules.map(m => <option key={m.id} value={m.id}>{moduleLabel(m)}</option>)}
        </Select>
        <Select value={session} onChange={(e) => setSession(e.target.value)}>
          <option value="all">Toutes sessions</option>
          <option value="Normale">Normale</option>
          <option value="Rattrapage">Rattrapage</option>
        </Select>
        <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="">Tous semestres</option>
          <option value="1">Semestre 1</option>
          <option value="2">Semestre 2</option>
        </Select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded border">
        <table className="min-w-full text-sm text-center border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 border">Elève</th>
              <th className="px-2 py-1 border">Matricule</th>
              <th className="px-2 py-1 border">Filière</th>
              <th className="px-2 py-1 border">Promotion</th>
              <th className="px-2 py-1 border">Module</th>
              <th className="px-2 py-1 border">CE</th>
              <th className="px-2 py-1 border">FE</th>
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
            ) : notes.map(n => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-2 py-1">{n.student?.nom} {n.student?.prenom}</td>
                <td className="px-2 py-1">{n.student?.matricule ?? "-"}</td>
                <td className="px-2 py-1">{n.student?.promotion?.filiere?.nom ?? "-"}</td>
                <td className="px-2 py-1">{n.student?.promotion?.nom ?? "-"}</td>
                <td className="px-2 py-1">{moduleLabel(n.module)}</td>
                <td className="px-2 py-1">{n.ce ?? "-"}</td>
                <td className="px-2 py-1">{n.fe ?? "-"}</td>
                <td className="px-2 py-1">{n.score ?? "-"}</td>
                <td className="px-2 py-1">{n.appreciation ?? "-"}</td>
                <td className="px-2 py-1">{n.session ?? "-"}</td>
                <td className="px-2 py-1">{n.semester ?? "-"}</td>
                <td className="px-2 py-1 flex gap-2 justify-center">
                  <button onClick={() => openEditForm(n)} className="p-2 border rounded hover:bg-gray-100" title="Modifier">
                    <LucideEdit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteNote(n.id, n.moduleId)} className="p-2 border rounded bg-red-500 text-white hover:opacity-90" title="Supprimer">
                    <LucideTrash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded p-4 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">{editingNote ? "Modifier la note" : "Ajouter une note"}</h3>
            <div className="space-y-2">
              <Select value={form.moduleId} onChange={(e) => setForm({...form, moduleId: e.target.value})}>
                {modules.map(m => <option key={m.id} value={m.id}>{moduleLabel(m)}</option>)}
              </Select>
              <Select value={form.studentId} onChange={(e) => setForm({...form, studentId: e.target.value})}>
                {students.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
              </Select>
              <Input type="number" placeholder="CE" value={form.ce} onChange={(e) => setForm({...form, ce: e.target.value})} />
              <Input type="number" placeholder="FE" value={form.fe} onChange={(e) => setForm({...form, fe: e.target.value})} />
              <Input placeholder="Appréciation" value={form.appreciation} onChange={(e) => setForm({...form, appreciation: e.target.value})} />
              <Select value={form.session} onChange={(e) => setForm({...form, session: e.target.value})}>
                <option value="Normale">Normale</option>
                <option value="Rattrapage">Rattrapage</option>
              </Select>
              <Select value={form.semester} onChange={(e) => setForm({...form, semester: e.target.value})}>
                <option value="1">Semestre 1</option>
                <option value="2">Semestre 2</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowForm(false)} variant="outline">Annuler</Button>
              <Button onClick={handleSubmit}>{editingNote ? "Modifier" : "Ajouter"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
