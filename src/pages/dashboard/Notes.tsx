// src/pages/dashboard/Notes.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/axiosConfig";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucideEdit, LucideTrash2, LucideRefreshCw, LucideDownload, LucideX } from "lucide-react";

// ================== Types ==================
interface Filiere { id: number; nom: string; }
interface Promotion { id: number; nom?: string; annee?: number; filiereId?: number | null; filiere?: Filiere | null; }
interface ModuleType {
  id: string;
  nom?: string;
  title?: string;
  code?: string;
  promotionId?: number | null;
  promotion?: Promotion | null;
  semester?: number;
}
interface Student {
  id: string;
  matricule?: string;
  nom: string;
  prenom?: string;
  promotionId?: number | null;
  promotion?: Promotion | null;
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

// ================== UI helpers ==================
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select {...props} className="border rounded px-2 py-2 w-full bg-white">
    {children}
  </select>
);

// ================== Component ==================
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

  // ================== Fetch ==================
  useEffect(() => {
    fetchAllStatic();
    fetchNotes();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchNotes, 300);
    return () => clearTimeout(t);
  }, [search, promotionId, moduleId, session, semester]);

  const fetchAllStatic = async () => {
    try {
      const [mRes, sRes, pRes, fRes] = await Promise.all([
        api.get("/modules/my"),
        api.get("/students"),
        api.get("/promotions"),
        api.get("/filieres"),
      ]);
      setModules(Array.isArray(mRes.data?.data) ? mRes.data.data : []);
      setStudents(Array.isArray(sRes.data?.data) ? sRes.data.data : []);
      setPromotions(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
      setFilieres(Array.isArray(fRes.data?.data) ? fRes.data.data : []);
    } catch {
      setErrorMsg("Impossible de charger les données statiques");
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
      setNotes(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  // ================== Helpers ==================
  const moduleLabel = (m?: ModuleType | null) => m ? m.nom ?? m.title ?? m.code ?? m.id : "-";

  const studentsForModule = (modId?: string) => {
    const mod = modules.find((m) => m.id === modId);
    if (!mod?.promotionId) return [];
    return students.filter((s) => s.promotionId === mod.promotionId);
  };

  const filiereNameFromNote = (n: NoteItem) => {
    const promotion = n.student?.promotion ?? promotions.find((p) => p.id === n.student?.promotionId);
    const fil = filieres.find((f) => f.id === promotion?.filiereId);
    return fil?.nom ?? "-";
  };

  const computedScore = (ce?: number | null, fe?: number | null) => {
    const c = typeof ce === "number" ? ce : 0;
    const f = typeof fe === "number" ? fe : 0;
    return Math.round((c * 0.4 + f * 0.6) * 100) / 100;
  };

  // ================== Form ==================
  const openAddForm = () => {
    const m = modules[0];
    const st = studentsForModule(m?.id)[0];
    setEditingNote(null);
    setForm({
      studentId: st?.id ?? "",
      moduleId: m?.id ?? "",
      ce: "",
      fe: "",
      session: "Normale",
      semester: m?.semester ? String(m.semester) : "1",
      appreciation: "",
    });
    setShowForm(true);
  };

  const openEditForm = (n: NoteItem) => {
    setEditingNote(n);
    setForm({
      studentId: n.studentId,
      moduleId: n.moduleId,
      ce: n.ce != null ? String(n.ce) : "",
      fe: n.fe != null ? String(n.fe) : "",
      session: n.session ?? "Normale",
      semester: n.semester ? String(n.semester) : "1",
      appreciation: n.appreciation ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    const payload = {
      studentId: form.studentId,
      moduleId: form.moduleId,
      ce: form.ce === "" ? 0 : Number(form.ce),
      fe: form.fe === "" ? 0 : Number(form.fe),
      session: form.session,
      semester: Number(form.semester || 1),
      appreciation: form.appreciation,
    };
    try {
      if (editingNote) await api.put(`/notes/${editingNote.id}`, payload);
      else await api.post("/notes", payload);
      setShowForm(false);
      setSuccessMsg(editingNote ? "Note modifiée" : "Note ajoutée");
      fetchNotes();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const deleteNote = async (id: string) => {
    if (!window.confirm("Supprimer cette note ?")) return;
    try {
      await api.delete(`/notes/${id}`);
      setSuccessMsg("Note supprimée");
      fetchNotes();
    } catch {
      setErrorMsg("Erreur lors de la suppression");
    }
  };

  // ================== Export ==================
  const exportToExcel = () => {
    const rows = notes.map((n) => {
      const st = n.student;
      const mod = n.module;
      const promo = st?.promotion ?? promotions.find((p) => p.id === st?.promotionId);
      const fil = filieres.find((f) => f.id === promo?.filiereId);
      return {
        Etudiant: `${st?.nom ?? ""} ${st?.prenom ?? ""}`.trim(),
        Matricule: st?.matricule ?? "",
        Filiere: fil?.nom ?? "-",
        Promotion: promo?.nom ?? "-",
        Module: moduleLabel(mod),
        CE: n.ce ?? "",
        FE: n.fe ?? "",
        Score: n.score ?? computedScore(n.ce, n.fe),
        Session: n.session ?? "",
        Semestre: n.semester ?? "",
        Appreciation: n.appreciation ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([out]), `notes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ================== Render ==================
  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h2 className="text-2xl font-bold">Notes</h2>
        <div className="flex gap-2">
          <Button onClick={openAddForm}>Ajouter</Button>
          <Button variant="outline" onClick={fetchNotes}><LucideRefreshCw className="w-4 h-4 mr-1"/>Actualiser</Button>
          <Button variant="ghost" onClick={exportToExcel}><LucideDownload className="w-4 h-4 mr-1"/>Excel</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Input placeholder="Recherche" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <Select value={promotionId} onChange={(e)=>setPromotionId(e.target.value as any)}>
          <option value="all">Toutes promotions</option>
          {promotions.map(p=> <option key={p.id} value={p.id}>{p.nom}</option>)}
        </Select>
        <Select value={moduleId} onChange={(e)=>setModuleId(e.target.value as any)}>
          <option value="all">Tous modules</option>
          {modules.map(m=> <option key={m.id} value={m.id}>{moduleLabel(m)}</option>)}
        </Select>
        <Select value={session} onChange={(e)=>setSession(e.target.value as any)}>
          <option value="all">Toutes sessions</option>
          <option value="Normale">Normale</option>
          <option value="Rattrapage">Rattrapage</option>
        </Select>
        <Select value={semester} onChange={(e)=>setSemester(e.target.value)}>
          <option value="">Tous semestres</option>
          <option value="1">Semestre 1</option>
          <option value="2">Semestre 2</option>
        </Select>
      </div>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      {successMsg && <p className="text-green-600">{successMsg}</p>}

      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm text-center">
          <thead className="bg-gray-100">
            <tr>
              <th>Etudiant</th><th>Matricule</th><th>Filiere</th><th>Promotion</th><th>Module</th>
              <th>CE</th><th>FE</th><th>Score</th><th>Session</th><th>Sem</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="py-4">Chargement...</td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={11} className="py-4 text-gray-500">Aucune donnée</td></tr>
            ) : notes.map(n => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td>{n.student?.nom} {n.student?.prenom}</td>
                <td>{n.student?.matricule ?? "-"}</td>
                <td>{filiereNameFromNote(n)}</td>
                <td>{n.student?.promotion?.nom ?? "-"}</td>
                <td>{moduleLabel(n.module)}</td>
                <td>{n.ce ?? "-"}</td>
                <td>{n.fe ?? "-"}</td>
                <td>{n.score ?? computedScore(n.ce, n.fe)}</td>
                <td>{n.session ?? "-"}</td>
                <td>{n.semester ?? "-"}</td>
                <td className="flex gap-2 justify-center">
                  <Button size="sm" onClick={()=>openEditForm(n)}><LucideEdit className="w-4 h-4"/></Button>
                  <Button size="sm" variant="destructive" onClick={()=>deleteNote(n.id)}><LucideTrash2 className="w-4 h-4"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-lg space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{editingNote ? "Modifier" : "Ajouter"} note</h3>
              <button onClick={()=>setShowForm(false)}><LucideX/></button>
            </div>
            <Select value={form.moduleId} onChange={(e)=>{
              const v=e.target.value;
              setForm(f=>({ ...f, moduleId:v, studentId: studentsForModule(v)[0]?.id ?? "" }));
            }}>
              {modules.map(m=> <option key={m.id} value={m.id}>{moduleLabel(m)}</option>)}
            </Select>
            <Select value={form.studentId} onChange={(e)=>setForm({...form, studentId:e.target.value})}>
              {studentsForModule(form.moduleId).map(s=> <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
            </Select>
            <Input type="number" placeholder="CE" value={form.ce} onChange={(e)=>setForm({...form, ce:e.target.value})} />
            <Input type="number" placeholder="FE" value={form.fe} onChange={(e)=>setForm({...form, fe:e.target.value})} />
            <Select value={form.session} onChange={(e)=>setForm({...form, session:e.target.value})}>
              <option value="Normale">Normale</option>
              <option value="Rattrapage">Rattrapage</option>
            </Select>
            <Select value={form.semester} onChange={(e)=>setForm({...form, semester:e.target.value})}>
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </Select>
            <Input placeholder="Appréciation" value={form.appreciation} onChange={(e)=>setForm({...form, appreciation:e.target.value})} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setShowForm(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>{editingNote ? "Modifier" : "Ajouter"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
