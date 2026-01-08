import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LucideEdit, LucideTrash2, LucideRefreshCw, LucideDownload } from "lucide-react";

/* ================= TYPES ================= */
interface Module {
  id: string;
  title?: string;
  nom?: string;
  code?: string;
}

interface Student {
  id: string;
  nom: string;
  prenom?: string;
  matricule?: string;
}

interface Note {
  id: string;
  studentId: string;
  moduleId: string;
  ce?: number;
  fe?: number;
  score?: number;
  session?: string;
  semester?: number;
  appreciation?: string;
  student?: Student;
  module?: Module;
}

/* ================= SELECT ================= */
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="border rounded px-2 py-2 w-full">
    {props.children}
  </select>
);

/* ================= COMPONENT ================= */
const Notes: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role?.name;

  const isAdmin = ["admin", "secretary", "DE"].includes(role);
  const isTeacher = role === "teacher";

  const [modules, setModules] = useState<Module[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const [form, setForm] = useState({
    studentId: "",
    moduleId: "",
    ce: "",
    fe: "",
    session: "Normale",
    semester: "1",
    appreciation: "",
  });

  /* ================= INIT ================= */
  useEffect(() => {
    if (isAdmin) loadAdmin();
    if (isTeacher) loadTeacher();
  }, []);

  /* ================= ADMIN ================= */
  const loadAdmin = async () => {
    try {
      const [m, s, n] = await Promise.all([
        api.get("/modules"),
        api.get("/students"),
        api.get("/notes"),
      ]);

      setModules(m.data.data || []);
      setStudents(s.data.data || []);
      setNotes(n.data.data || []);
    } catch {
      setError("Erreur chargement admin");
    }
  };

  /* ================= TEACHER ================= */
  const loadTeacher = async () => {
    try {
      const mRes = await api.get("/modules/my");
      const mods: Module[] = mRes.data.data || [];
      setModules(mods);

      let allNotes: Note[] = [];
      for (const m of mods) {
        const res = await api.get(`/notes/module/${m.id}`);
        allNotes.push(...(res.data.data || []));
      }
      setNotes(allNotes);
    } catch {
      setError("Erreur chargement enseignant");
    }
  };

  /* ================= STUDENTS BY MODULE ================= */
  const loadStudentsByModule = async (moduleId: string) => {
    try {
      const res = await api.get(`/students/by-module/${moduleId}`);
      setStudents(res.data.data || []);
    } catch {
      setStudents([]);
    }
  };

  /* ================= ADD / EDIT ================= */
  const openAdd = () => {
    if (!modules.length) {
      setError("Aucun module disponible");
      return;
    }
    setForm({
      studentId: "",
      moduleId: modules[0].id,
      ce: "",
      fe: "",
      session: "Normale",
      semester: "1",
      appreciation: "",
    });
    loadStudentsByModule(modules[0].id);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setForm({
      studentId: n.studentId,
      moduleId: n.moduleId,
      ce: String(n.ce ?? ""),
      fe: String(n.fe ?? ""),
      session: n.session ?? "Normale",
      semester: String(n.semester ?? "1"),
      appreciation: n.appreciation ?? "",
    });
    loadStudentsByModule(n.moduleId);
    setShowForm(true);
  };

  /* ================= SAVE ================= */
  const save = async () => {
    const payload = {
      ...form,
      ce: Number(form.ce),
      fe: Number(form.fe),
      semester: Number(form.semester),
    };

    try {
      if (editing) {
        await api.put(`/notes/module/${editing.moduleId}/${editing.id}`, payload);
      } else {
        await api.post(`/notes/module/${payload.moduleId}/add`, payload);
      }
      setShowForm(false);
      loadTeacher();
    } catch {
      setError("Erreur sauvegarde");
    }
  };

  /* ================= EXPORT ================= */
  const exportExcel = () => {
    const data = notes.map(n => ({
      Étudiant: `${n.student?.nom} ${n.student?.prenom ?? ""}`,
      Module: n.module?.title ?? n.module?.code,
      CE: n.ce,
      FE: n.fe,
      Score: n.score,
      Session: n.session,
      Semestre: n.semester,
      Appréciation: n.appreciation,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    saveAs(new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })]), "notes.xlsx");
  };

  /* ================= RENDER ================= */
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Gestion des notes</h2>
        <div className="flex gap-2">
          <Button onClick={openAdd}>Ajouter</Button>
          <Button onClick={exportExcel} variant="ghost">
            <LucideDownload className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th>Étudiant</th><th>Module</th><th>Score</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notes.map(n => (
            <tr key={n.id} className="border-t">
              <td>{n.student?.nom}</td>
              <td>{n.module?.title}</td>
              <td>{n.score}</td>
              <td>
                <button onClick={() => openEdit(n)}>
                  <LucideEdit className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96 space-y-2">
            <Select value={form.moduleId} onChange={e => {
              setForm({ ...form, moduleId: e.target.value });
              loadStudentsByModule(e.target.value);
            }}>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </Select>

            <Select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>
              ))}
            </Select>

            <Input placeholder="CE" value={form.ce} onChange={e => setForm({ ...form, ce: e.target.value })} />
            <Input placeholder="FE" value={form.fe} onChange={e => setForm({ ...form, fe: e.target.value })} />

            <Button onClick={save}>Enregistrer</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
