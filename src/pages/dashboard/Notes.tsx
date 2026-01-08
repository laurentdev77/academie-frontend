import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/axiosConfig";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  LucideEdit,
  LucideTrash2,
  LucideRefreshCw,
  LucideDownload,
  LucidePlus,
} from "lucide-react";

/* ===================== TYPES ===================== */
interface Filiere {
  id: number;
  nom: string;
}

interface Promotion {
  id: number;
  nom?: string;
  annee?: number;
  filiereId?: number | null;
}

interface ModuleType {
  id: string;
  nom?: string;
  title?: string;
  code?: string;
  promotionId?: number | null;
  semester?: number;
}

interface Student {
  id: string;
  nom: string;
  prenom?: string;
  matricule?: string;
  promotionId?: number | null;
}

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

/* ===================== UI ===================== */
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="border rounded px-2 py-2 w-full">
    {props.children}
  </select>
);

/* ===================== COMPONENT ===================== */
const Notes: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    moduleId: "all",
    session: "all",
    semester: "",
  });

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

  /* ===================== FETCH ===================== */
  const fetchStaticData = async () => {
    try {
      const [m, s, p, f] = await Promise.all([
        api.get("/modules/my"),
        api.get("/students"),
        api.get("/promotions"),
        api.get("/filieres"),
      ]);

      setModules(m.data?.data ?? []);
      setStudents(s.data?.data ?? []);
      setPromotions(p.data?.data ?? []);
      setFilieres(f.data?.data ?? []);
    } catch {
      setErrorMsg("Erreur chargement données");
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.moduleId !== "all") params.moduleId = filters.moduleId;
      if (filters.session !== "all") params.session = filters.session;
      if (filters.semester) params.semester = filters.semester;

      const res = await api.get("/notes", { params });
      setNotes(res.data?.data ?? []);
    } catch {
      setErrorMsg("Erreur chargement notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaticData();
    fetchNotes();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchNotes, 300);
    return () => clearTimeout(t);
  }, [filters]);

  /* ===================== HELPERS ===================== */
  const moduleLabel = (m?: ModuleType | null) =>
    m?.nom || m?.title || m?.code || "-";

  const studentsForModule = useMemo(() => {
    const mod = modules.find((m) => m.id === form.moduleId);
    if (!mod?.promotionId) return [];
    return students.filter((s) => s.promotionId === mod.promotionId);
  }, [form.moduleId, modules, students]);

  /* ===================== FORM ===================== */
  const openAdd = () => {
    if (modules.length === 0) return;
    setEditingNote(null);

    const mod = modules[0];
    setForm({
      moduleId: mod.id,
      studentId: "",
      ce: "",
      fe: "",
      session: "Normale",
      semester: String(mod.semester ?? 1),
      appreciation: "",
    });

    setShowForm(true);
  };

  const openEdit = (n: NoteItem) => {
    setEditingNote(n);
    setForm({
      moduleId: n.moduleId,
      studentId: n.studentId,
      ce: n.ce?.toString() ?? "",
      fe: n.fe?.toString() ?? "",
      session: n.session ?? "Normale",
      semester: String(n.semester ?? 1),
      appreciation: n.appreciation ?? "",
    });
    setShowForm(true);
  };

  const submitForm = async () => {
    try {
      const payload = {
        studentId: form.studentId,
        moduleId: form.moduleId,
        ce: Number(form.ce) || 0,
        fe: Number(form.fe) || 0,
        session: form.session,
        semester: Number(form.semester),
        appreciation: form.appreciation,
      };

      if (editingNote)
        await api.put(`/notes/${editingNote.id}`, payload);
      else
        await api.post("/notes", payload);

      setShowForm(false);
      fetchNotes();
      setSuccessMsg("Enregistrement réussi");
    } catch {
      setErrorMsg("Erreur enregistrement note");
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Supprimer cette note ?")) return;
    try {
      await api.delete(`/notes/${id}`);
      fetchNotes();
    } catch {
      setErrorMsg("Erreur suppression");
    }
  };

  /* ===================== EXPORT ===================== */
  const exportExcel = () => {
    const data = notes.map((n) => ({
      Étudiant: `${n.student?.nom ?? ""} ${n.student?.prenom ?? ""}`,
      Matricule: n.student?.matricule ?? "",
      Module: moduleLabel(n.module),
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
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([out]), "notes.xlsx");
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Gestion des Notes</h2>
        <div className="flex gap-2">
          <Button onClick={openAdd}><LucidePlus className="w-4 h-4 mr-1" />Ajouter</Button>
          <Button variant="outline" onClick={fetchNotes}><LucideRefreshCw className="w-4 h-4" /></Button>
          <Button variant="ghost" onClick={exportExcel}><LucideDownload className="w-4 h-4" /></Button>
        </div>
      </div>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      {successMsg && <p className="text-green-600">{successMsg}</p>}

      <div className="bg-white border rounded">
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-100">
            <tr>
              <th>Étudiant</th>
              <th>Module</th>
              <th>CE</th>
              <th>FE</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Chargement...</td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={6}>Aucune note</td></tr>
            ) : (
              notes.map((n) => (
                <tr key={n.id}>
                  <td>{n.student?.nom} {n.student?.prenom}</td>
                  <td>{moduleLabel(n.module)}</td>
                  <td>{n.ce}</td>
                  <td>{n.fe}</td>
                  <td>{n.score}</td>
                  <td className="flex justify-center gap-2">
                    <Button size="sm" onClick={() => openEdit(n)}><LucideEdit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteNote(n.id)}><LucideTrash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-md space-y-3">
            <h3 className="font-semibold">{editingNote ? "Modifier" : "Ajouter"} une note</h3>

            <Select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })}>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{moduleLabel(m)}</option>
              ))}
            </Select>

            <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">-- Étudiant --</option>
              {studentsForModule.map((s) => (
                <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>
              ))}
            </Select>

            <Input placeholder="CE" type="number" value={form.ce} onChange={(e) => setForm({ ...form, ce: e.target.value })} />
            <Input placeholder="FE" type="number" value={form.fe} onChange={(e) => setForm({ ...form, fe: e.target.value })} />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button onClick={submitForm}>Valider</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
