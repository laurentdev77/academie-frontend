import React, { useEffect, useState, useRef } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "sonner";

/* ===================== TYPES ===================== */
interface Filiere {
  id: string;
  nom: string;
}

interface Promotion {
  id: string;
  nom: string;
  annee?: number;
  filiereId: string;
}

interface Student {
  id: string;
  nom: string;
  prenom?: string;
  matricule?: string;
}

interface Module {
  id: string;
  title: string;
  code: string;
}

interface Note {
  id?: string;
  studentId: string;
  moduleId: string;
  ce?: number | string;
  fe?: number | string;
  score?: number;
  appreciation?: string;
  session?: string;
  student?: Student;
}

/* ===================== COMPONENT ===================== */
const NotesEnseignant: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [selectedModule, setSelectedModule] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedPromotion, setSelectedPromotion] = useState("");

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

  const [noteForm, setNoteForm] = useState<Note>({
    studentId: "",
    moduleId: "",
    ce: "",
    fe: "",
    appreciation: "",
    session: "Normale",
  });

  const printRef = useRef<HTMLDivElement | null>(null);

  /* ===================== PRINT ===================== */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Notes du module",
  });

  /* ===================== FETCHERS ===================== */
  const fetchModules = async () => {
    const res = await api.get("/modules/my");
    setModules(res.data?.data ?? []);
  };

  const fetchFilieres = async () => {
    const res = await api.get("/filieres");
    setFilieres(res.data?.data ?? res.data ?? []);
  };

  const fetchPromotions = async (filiereId: string) => {
    const res = await api.get(`/promotions/by-filiere/${filiereId}`);
    setPromotions(res.data?.data ?? res.data ?? []);
  };

  const fetchStudents = async (promotionId: string) => {
    const res = await api.get(`/students/by-promotion/${promotionId}`);
    setStudents(res.data?.data ?? res.data ?? []);
  };

  const fetchNotes = async (moduleId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/notes/module/${moduleId}`);
      setNotes(res.data?.data ?? []);
    } catch {
      toast.error("Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== SAVE ===================== */
  const handleSaveNote = async () => {
    if (!noteForm.studentId) return toast.error("Sélectionnez un étudiant");
    if (!selectedModule) return toast.error("Sélectionnez un module");

    try {
      if (isEditing && currentNoteId) {
        await api.put(`/notes/${currentNoteId}`, noteForm);
      } else {
        await api.post("/notes", noteForm);
      }
      toast.success("Note enregistrée");
      setShowModal(false);
      fetchNotes(selectedModule);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur");
    }
  };

  /* ===================== DELETE ===================== */
  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Supprimer ?")) return;
    await api.delete(`/notes/${id}`);
    fetchNotes(selectedModule);
  };

  /* ===================== EDIT ===================== */
  const handleEdit = (n: Note) => {
    setNoteForm({
      studentId: n.studentId,
      moduleId: n.moduleId,
      ce: n.ce ?? "",
      fe: n.fe ?? "",
      appreciation: n.appreciation ?? "",
      session: n.session ?? "Normale",
    });
    setCurrentNoteId(n.id ?? null);
    setIsEditing(true);
    setShowModal(true);
  };

  /* ===================== EXPORT ===================== */
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      notes.map((n) => ({
        Étudiant: `${n.student?.nom} ${n.student?.prenom}`,
        Matricule: n.student?.matricule,
        EC: n.ce,
        EF: n.fe,
        Moyenne: n.score,
        Session: n.session,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([out]), "notes.xlsx");
  };

  /* ===================== INIT ===================== */
  useEffect(() => {
    fetchModules();
    fetchFilieres();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      setNoteForm((p) => ({ ...p, moduleId: selectedModule }));
      fetchNotes(selectedModule);
    }
  }, [selectedModule]);

  /* ===================== RENDER ===================== */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Notes des Élèves Officiers</h1>

      <div className="flex gap-2 mb-4">
        <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
          <option value="">— Module —</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({m.code})
            </option>
          ))}
        </select>

        <Button onClick={() => { setShowModal(true); setIsEditing(false); }}>
          Ajouter une note
        </Button>
        <Button onClick={exportExcel}>Excel</Button>
        <Button onClick={handlePrint}>Imprimer</Button>
      </div>

      {/* TABLE */}
      <div ref={printRef} className="bg-white border rounded p-4">
        {loading ? "Chargement..." : notes.length === 0 ? "Aucune note" : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th>Nom</th><th>Matricule</th><th>EC</th><th>EF</th><th>Moy.</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-t">
                  <td>{n.student?.nom}</td>
                  <td>{n.student?.matricule}</td>
                  <td>{n.ce}</td>
                  <td>{n.fe}</td>
                  <td>{n.score}</td>
                  <td>
                    <Button size="sm" onClick={() => handleEdit(n)}>✏️</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(n.id)}>🗑</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 w-[400px] rounded">
            <h2 className="font-semibold mb-2">
              {isEditing ? "Modifier" : "Ajouter"} une note
            </h2>

            <select
              value={selectedFiliere}
              onChange={(e) => {
                setSelectedFiliere(e.target.value);
                setSelectedPromotion("");
                setStudents([]);
                fetchPromotions(e.target.value);
              }}
            >
              <option value="">— Filière —</option>
              {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>

            <select
              disabled={!selectedFiliere}
              value={selectedPromotion}
              onChange={(e) => {
                setSelectedPromotion(e.target.value);
                fetchStudents(e.target.value);
              }}
            >
              <option value="">— Promotion —</option>
              {promotions.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>

            <select
              value={noteForm.studentId}
              onChange={(e) => setNoteForm({ ...noteForm, studentId: e.target.value })}
            >
              <option value="">— Étudiant —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} {s.prenom} ({s.matricule})
                </option>
              ))}
            </select>

            <Input placeholder="EC" value={noteForm.ce} onChange={(e) => setNoteForm({ ...noteForm, ce: e.target.value })} />
            <Input placeholder="EF" value={noteForm.fe} onChange={(e) => setNoteForm({ ...noteForm, fe: e.target.value })} />
            <Input placeholder="Appréciation" value={noteForm.appreciation} onChange={(e) => setNoteForm({ ...noteForm, appreciation: e.target.value })} />

            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSaveNote}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesEnseignant;
