// src/pages/dashboard/Notes.tsx
import React, { useEffect, useState } from "react";
import api from "@/services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Composants UI simples
const Button = ({ children, onClick, variant }: { children: React.ReactNode; onClick?: () => void; variant?: "outline" | "ghost" }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded ${
      variant === "outline"
        ? "border border-gray-400 text-gray-700 hover:bg-gray-100"
        : variant === "ghost"
        ? "text-gray-700 hover:bg-gray-100"
        : "bg-blue-600 text-white hover:bg-blue-700"
    }`}
  >
    {children}
  </button>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="w-full border rounded p-2" />
);

const Modal = ({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) => (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded w-full max-w-md relative">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      {children}
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold">
        ✕
      </button>
    </div>
  </div>
);

// TYPES
interface Filiere { id: number; nom: string; }
interface Promotion { id: number; nom?: string; annee?: number; filiereId?: number | null; filiere?: Filiere | null; }
interface ModuleType { id: string; title?: string; code?: string; promotionId?: number | null; promotion?: Promotion | null; teacherId?: string; }
interface Student { id: string; nom?: string; prenom?: string; matricule?: string; promotionId?: number | null; promotion?: Promotion | null; }
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

// COMPONENT
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

  const [showModal, setShowModal] = useState(false);
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
  // FETCH STATIC DATA
  // -----------------------------
  useEffect(() => {
    if (!isAdmin && !isTeacher) return;
    fetchAllStatic();
  }, []);

  useEffect(() => {
    if (!isAdmin && !isTeacher) return;
    const t = setTimeout(() => fetchNotes(), 300);
    return () => clearTimeout(t);
  }, [search, promotionId, moduleId, session, semester, modules]);

  const fetchAllStatic = async () => {
    try {
      if (isAdmin) {
        const [mRes, sRes, pRes, fRes] = await Promise.all([
          api.get("/modules"),
          api.get("/students"),
          api.get("/promotions"),
          api.get("/filieres"),
        ]);
        setModules(Array.isArray(mRes.data?.data || mRes.data) ? mRes.data?.data || mRes.data : []);
        setStudents(Array.isArray(sRes.data?.data || sRes.data) ? sRes.data?.data || sRes.data : []);
        setPromotions(Array.isArray(pRes.data?.data || pRes.data) ? pRes.data?.data || pRes.data : []);
        setFilieres(Array.isArray(fRes.data?.data || fRes.data) ? fRes.data?.data || fRes.data : []);
      } else if (isTeacher) {
        // Modules du teacher
        const mRes = await api.get("/modules/my");
        const modulesData: ModuleType[] = Array.isArray(mRes.data?.data) ? mRes.data.data : [];
        setModules(modulesData);

        // Étudiants par module
        let allStudents: Student[] = [];
        for (const m of modulesData) {
          try {
            const sRes = await api.get(`/students/by-module/${m.id}`);
            if (Array.isArray(sRes.data)) allStudents.push(...sRes.data);
          } catch (err) {
            console.error("fetch students for module error:", err);
          }
        }
        setStudents(allStudents);
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
      if (isTeacher) {
        let notesArr: NoteItem[] = [];
        for (const m of modules) {
          if (moduleId !== "all" && m.id !== moduleId) continue;
          try {
            const r = await api.get(`/notes/module/${m.id}`);
            if (Array.isArray(r.data?.data)) notesArr.push(...r.data.data);
          } catch (err) {
            console.error(`fetch notes for module ${m.id} error:`, err);
          }
        }
        setNotes(notesArr);
      } else {
        const params: any = {};
        if (search) params.search = search;
        if (promotionId !== "all") params.promotionId = promotionId;
        if (moduleId !== "all") params.moduleId = moduleId;
        if (session !== "all") params.session = session;
        if (semester) params.semester = semester;
        const res = await api.get("/notes", { params });
        setNotes(Array.isArray(res.data?.data) ? res.data.data : []);
      }
    } catch (err: any) {
      console.error("fetchNotes error:", err);
      setErrorMsg(err?.response?.data?.message || "Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForModule = async (moduleId: string) => {
    try {
      const res = await api.get(`/students/by-module/${moduleId}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error("fetchStudentsForModule error:", err);
      return [];
    }
  };

  // -----------------------------
  // FORM HANDLERS
  // -----------------------------
  const openAddForm = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!modules.length) return setErrorMsg("Aucun module disponible.");
    const firstModuleId = modules[0].id;
    const studentsForModule = await fetchStudentsForModule(firstModuleId);
    if (!studentsForModule.length) return setErrorMsg("Aucun étudiant disponible pour ce module.");

    setStudents(studentsForModule);
    setEditingNote(null);
    setForm({
      studentId: studentsForModule[0].id,
      moduleId: firstModuleId,
      ce: "",
      fe: "",
      session: "Normale",
      semester: "1",
      appreciation: "",
    });
    setShowModal(true);
  };

  const openEditForm = async (n: NoteItem) => {
    setEditingNote(n);
    if (!students.find((s) => s.id === n.studentId)) {
      const fetchedStudents = await fetchStudentsForModule(n.moduleId);
      setStudents(fetchedStudents);
    }
    setForm({
      studentId: n.studentId,
      moduleId: n.moduleId,
      ce: n.ce !== undefined && n.ce !== null ? String(n.ce) : "",
      fe: n.fe !== undefined && n.fe !== null ? String(n.fe) : "",
      session: n.session ?? "Normale",
      semester: n.semester ? String(n.semester) : "1",
      appreciation: n.appreciation ?? "",
    });
    setShowModal(true);
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
        await api.put(`/notes/module/${payload.moduleId}/${editingNote.id}`, payload);
      } else {
        await api.post(`/notes/module/${payload.moduleId}/add`, payload);
      }
      setShowModal(false);
      fetchNotes();
      setSuccessMsg("Note enregistrée avec succès");
    } catch (err: any) {
      console.error("submit note error:", err);
      setErrorMsg(err?.response?.data?.message || "Erreur lors de l'enregistrement de la note");
    }
  };

  const deleteNote = async (id: string, moduleId?: string) => {
    if (!window.confirm("Supprimer cette note ?")) return;
    try {
      if (moduleId) await api.delete(`/notes/module/${moduleId}/${id}`);
      fetchNotes();
      setSuccessMsg("Note supprimée");
    } catch (err) {
      console.error("delete note error:", err);
      setErrorMsg("Erreur lors de la suppression de la note");
    }
  };

  // -----------------------------
  // EXPORT EXCEL
  // -----------------------------
  const exportToExcel = () => {
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
        Module: mod?.title ?? mod?.code ?? "-",
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

  const moduleLabel = (m?: ModuleType | null) => (m ? m.title ?? m.code ?? "-" : "-");

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
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Notes des Élèves Officiers</h2>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={openAddForm}>Ajouter une note</Button>
          <Button onClick={fetchNotes} variant="outline">Actualiser</Button>
          <Button onClick={exportToExcel} variant="ghost">Exporter Excel</Button>
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
            ) : (
              notes.map((n) => (
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
                    <button onClick={() => openEditForm(n)} className="p-2 border rounded hover:bg-gray-100">✏️</button>
                    <button onClick={() => deleteNote(n.id, n.moduleId)} className="p-2 border rounded bg-red-500 text-white hover:opacity-90">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editingNote ? "Modifier Note" : "Ajouter Note"}>
          <div className="space-y-2">
            <label>Module</label>
            <select
              value={form.moduleId}
              onChange={async (e) => {
                const mId = e.target.value;
                setForm({ ...form, moduleId: mId });
                const studs = await fetchStudentsForModule(mId);
                setStudents(studs);
                setForm((prev) => ({ ...prev, studentId: studs[0]?.id ?? "" }));
              }}
              className="w-full border rounded p-2"
            >
              {modules.map((m) => <option key={m.id} value={m.id}>{moduleLabel(m)}</option>)}
            </select>

            <label>Étudiant</label>
            <select
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full border rounded p-2"
            >
              {students.map((s) => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
            </select>

            <label>CE</label>
            <Input type="number" value={form.ce} onChange={(e) => setForm({ ...form, ce: e.target.value })} />

            <label>FE</label>
            <Input type="number" value={form.fe} onChange={(e) => setForm({ ...form, fe: e.target.value })} />

            <label>Session</label>
            <select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} className="w-full border rounded p-2">
              <option value="Normale">Normale</option>
              <option value="Rattrapage">Rattrapage</option>
            </select>

            <label>Semestre</label>
            <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full border rounded p-2">
              <option value="1">1</option>
              <option value="2">2</option>
            </select>

            <label>Appréciation</label>
            <Input type="text" value={form.appreciation} onChange={(e) => setForm({ ...form, appreciation: e.target.value })} />

            {errorMsg && <p className="text-red-600">{errorMsg}</p>}
            {successMsg && <p className="text-green-600">{successMsg}</p>}

            <div className="flex justify-end gap-2 mt-2">
              <Button onClick={() => setShowModal(false)} variant="outline">Annuler</Button>
              <Button onClick={handleSubmit}>{editingNote ? "Modifier" : "Ajouter"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Notes;
