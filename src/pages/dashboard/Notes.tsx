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
  <select {...props} className="border rounded px-2 py-2 w-full">
    {props.children}
  </select>
);

// -----------------------------
// Composant Notes
// -----------------------------
const Notes: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = ["admin", "secretary", "DE"].includes(user?.role?.name);
  const isTeacher = user?.role?.name === "teacher";

  // -----------------------------
  // États
  // -----------------------------
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
    fetchAllStatic();
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
  const fetchAllStatic = async () => {
    try {
      if (isAdmin) {
        const [mRes, sRes, pRes, fRes] = await Promise.all([
          api.get("/modules"),
          api.get("/students"),
          api.get("/promotions"),
          api.get("/filieres"),
        ]);
        setModules(Array.isArray(mRes.data) ? mRes.data : []);
        setStudents(Array.isArray(sRes.data) ? sRes.data : []);
        setPromotions(Array.isArray(pRes.data) ? pRes.data : []);
        setFilieres(Array.isArray(fRes.data) ? fRes.data : []);
      } else if (isTeacher) {
        // fetch teacher modules
        try {
          const mRes = await api.get("/notes/my");
          const modulesData: ModuleType[] = Array.isArray(mRes.data?.data) ? mRes.data.data.map((n: NoteItem) => n.module).filter(Boolean) : [];
          setModules(modulesData);
        } catch (err: any) {
          console.error("fetch teacher modules error:", err);
          setErrorMsg(err?.response?.data?.message || "Impossible de charger les modules du professeur");
        }
      }
    } catch (err) {
      console.error("fetchAllStatic error:", err);
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
        if (moduleId !== "all") {
          res = await api.get(`/notes/module/${moduleId}`);
        } else {
          res = await api.get("/notes/my");
        }
      } else {
        const params: any = {};
        if (search) params.search = search;
        if (promotionId !== "all") params.promotionId = promotionId;
        if (moduleId !== "all") params.moduleId = moduleId;
        if (session !== "all") params.session = session;
        if (semester) params.semester = semester;

        res = await api.get("/notes", { params });
      }

      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotes(data);
    } catch (err: any) {
      console.error("fetchNotes error:", err);
      if (err?.response?.status === 403) setErrorMsg("Accès refusé : vous n'êtes pas autorisé à voir ces notes");
      else setErrorMsg(err?.response?.data?.message || "Erreur lors du chargement des notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // FORM HANDLERS
  // -----------------------------
  const openAddForm = () => {
    if (!modules.length || !students.length) {
      setErrorMsg("Aucun module ou étudiant disponible pour ajouter une note.");
      return;
    }
    setEditingNote(null);
    setForm({
      studentId: students[0]?.id ?? "",
      moduleId: modules[0]?.id ?? "",
      ce: "",
      fe: "",
      session: "Normale",
      semester: "1",
      appreciation: "",
    });
    setShowForm(true);
  };

  const openEditForm = (n: NoteItem) => {
    if (!n) return;
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
      if (editingNote) {
        if (isTeacher) await api.put(`/notes/module/${editingNote.moduleId}/${editingNote.id}`, payload);
        else await api.put(`/notes/${editingNote.id}`, payload);
      } else {
        if (isTeacher) await api.post(`/notes/module/${payload.moduleId}`, payload);
        else await api.post("/notes", payload);
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
      if (isTeacher && moduleId) await api.delete(`/notes/module/${moduleId}/${id}`);
      else await api.delete(`/notes/${id}`);
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
    if (!Array.isArray(notes) || notes.length === 0) return;
    const data = notes.map((n) => {
      const stud = n.student;
      const mod = n.module;
      const promotion = stud?.promotion ?? promotions.find((p) => p.id === stud?.promotionId);
      const filiere = filieres.find((f) => f.id === promotion?.filiereId);
      return {
        Étudiant: `${stud?.nom ?? ""} ${stud?.prenom ?? ""}`.trim(),
        Matricule: stud?.matricule ?? "",
        Filière: filiere?.nom ?? "-",
        Promotion: promotion?.nom ?? "-",
        Module: mod?.nom ?? mod?.title ?? mod?.code ?? mod?.id,
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

  const moduleLabel = (m?: ModuleType | null) => (m ? m.nom ?? m.title ?? m.code ?? m.id : "-");

  // -----------------------------
  // RENDER
  // -----------------------------
  if (!isAdmin && !isTeacher) {
    return (
      <div className="p-6">
        <p className="text-red-600">Accès réservé aux enseignants et à l’administration</p>
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

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded border">
        <table className="min-w-full text-sm text-center border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th>Elève</th>
              <th>Matricule</th>
              <th>Filière</th>
              <th>Promotion</th>
              <th>Module</th>
              <th>CE</th>
              <th>FE</th>
              <th>Score</th>
              <th>Appréciation</th>
              <th>Session</th>
              <th>Semestre</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="py-4">Chargement...</td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={12} className="py-4 text-gray-500">Aucune note trouvée</td></tr>
            ) : (
              notes.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td>{n.student?.nom} {n.student?.prenom}</td>
                  <td>{n.student?.matricule ?? "-"}</td>
                  <td>{n.student?.promotion?.filiere?.nom ?? "-"}</td>
                  <td>{n.student?.promotion?.nom ?? "-"}</td>
                  <td>{moduleLabel(n.module)}</td>
                  <td>{n.ce ?? "-"}</td>
                  <td>{n.fe ?? "-"}</td>
                  <td>{n.score ?? "-"}</td>
                  <td>{n.appreciation ?? "-"}</td>
                  <td>{n.session ?? "-"}</td>
                  <td>{n.semester ?? "-"}</td>
                  <td className="flex gap-2 justify-center">
                    <button onClick={() => openEditForm(n)} className="p-2 border rounded hover:bg-gray-100"><LucideEdit className="w-4 h-4" /></button>
                    <button onClick={() => deleteNote(n.id, n.moduleId)} className="p-2 border rounded bg-red-500 text-white hover:opacity-90"><LucideTrash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Notes;
