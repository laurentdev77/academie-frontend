import React, { useEffect, useState, useRef } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "sonner";

/* ============================================================
   🔹 Interfaces
============================================================ */
interface Student {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
}

interface Module {
  id: string;
  title: string;
  code: string;
  semester: number;
  credits: number;
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
  module?: Module;
}

/* ============================================================
   🔹 Composant
============================================================ */
const NotesEnseignant: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
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

  const printRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     🧾 Impression
  ============================================================ */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Notes du module",
  });

  /* ============================================================
     📚 API CALLS
  ============================================================ */
  const fetchModules = async () => {
    try {
      const res = await api.get("/modules/my");
      setModules(res.data?.data ?? []);
    } catch {
      toast.error("Erreur lors du chargement des modules.");
    }
  };

  const fetchStudents = async (moduleId: string) => {
    try {
      const res = await api.get(`/students/by-module/${moduleId}`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStudents([]);
      toast.error("Impossible de charger les étudiants.");
    }
  };

  const fetchNotes = async (moduleId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/notes/module/${moduleId}`);
      setNotes(res.data?.data ?? []);
    } catch {
      toast.error("Erreur lors du chargement des notes.");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     💾 Sauvegarde note
  ============================================================ */
  const handleSaveNote = async () => {
    if (!noteForm.studentId) return toast.error("Sélectionnez un étudiant.");

    try {
      if (isEditing && currentNoteId) {
        await api.put(
          `/notes/module/${selectedModule}/${currentNoteId}`,
          noteForm
        );
      } else {
        await api.post(
          `/notes/module/${selectedModule}/add`,
          noteForm
        );
      }

      toast.success(isEditing ? "Note modifiée." : "Note ajoutée.");
      setShowModal(false);
      fetchNotes(selectedModule);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur de sauvegarde.");
    }
  };

  /* ============================================================
     ❌ Suppression
  ============================================================ */
  const handleDelete = async (noteId?: string) => {
    if (!noteId || !confirm("Supprimer cette note ?")) return;
    try {
      await api.delete(`/notes/${noteId}`);
      toast.success("Note supprimée.");
      fetchNotes(selectedModule);
    } catch {
      toast.error("Erreur de suppression.");
    }
  };

  /* ============================================================
     ✏️ Edition
  ============================================================ */
  const handleEdit = (note: Note) => {
    setNoteForm({
      studentId: note.studentId,
      moduleId: note.moduleId,
      ce: note.ce ?? "",
      fe: note.fe ?? "",
      appreciation: note.appreciation ?? "",
      session: note.session ?? "Normale",
    });
    setCurrentNoteId(note.id || null);
    setIsEditing(true);
    setShowModal(true);
  };

  /* ============================================================
     📤 Exports
  ============================================================ */
  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 40;
    notes.forEach((n) => {
      doc.text(
        `${n.student?.nom} ${n.student?.prenom} : ${n.score ?? "-"}`,
        20,
        y
      );
      y += 10;
    });
    doc.save("notes_module.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      notes.map((n) => ({
        Nom: n.student?.nom,
        Prénom: n.student?.prenom,
        Matricule: n.student?.matricule,
        EC: n.ce,
        EF: n.fe,
        Moyenne: n.score,
        Session: n.session,
        Appréciation: n.appreciation,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    saveAs(
      new Blob([XLSX.write(wb, { type: "array" })]),
      "notes.xlsx"
    );
  };

  /* ============================================================
     ⚙️ Effects
  ============================================================ */
  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      setNoteForm((p) => ({ ...p, moduleId: selectedModule }));
      fetchStudents(selectedModule);
      fetchNotes(selectedModule);
    } else {
      setStudents([]);
      setNotes([]);
    }
  }, [selectedModule]);

  /* ============================================================
     🖥️ Render
  ============================================================ */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Notes des Élèves Officiers</h1>

      <div className="flex gap-2 mb-4">
        <select
          className="border px-2 py-1 rounded"
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
        >
          <option value="">-- Sélectionner un module --</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({m.code})
            </option>
          ))}
        </select>

        <Button
          onClick={() => {
            if (!selectedModule)
              return toast.error("Sélectionnez un module");
            setIsEditing(false);
            setNoteForm({
              studentId: "",
              moduleId: selectedModule,
              ce: "",
              fe: "",
              appreciation: "",
              session: "Normale",
            });
            setShowModal(true);
          }}
        >
          Ajouter une note
        </Button>

        <Button onClick={exportPDF}>PDF</Button>
        <Button onClick={exportExcel}>Excel</Button>
        <Button onClick={handlePrint}>Imprimer</Button>
      </div>

      {/* TABLE */}
      <div ref={printRef}>
        {loading ? (
          <p>Chargement...</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-500">Aucune note</p>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Matricule</th>
                <th>EC</th>
                <th>EF</th>
                <th>Moyenne</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-t">
                  <td>{n.student?.nom}</td>
                  <td>{n.student?.prenom}</td>
                  <td>{n.student?.matricule}</td>
                  <td>{n.ce ?? "-"}</td>
                  <td>{n.fe ?? "-"}</td>
                  <td>{n.score ?? "-"}</td>
                  <td className="flex gap-2">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[400px]">
            <select
              className="w-full border mb-2 p-1"
              value={noteForm.studentId}
              onChange={(e) =>
                setNoteForm({ ...noteForm, studentId: e.target.value })
              }
              disabled={students.length === 0}
            >
              <option value="">
                {students.length === 0
                  ? "Aucun étudiant"
                  : "-- Sélectionner --"}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} {s.prenom}
                </option>
              ))}
            </select>

            <Input
              placeholder="EC"
              type="number"
              value={noteForm.ce}
              onChange={(e) =>
                setNoteForm({ ...noteForm, ce: e.target.value })
              }
            />
            <Input
              placeholder="EF"
              type="number"
              value={noteForm.fe}
              onChange={(e) =>
                setNoteForm({ ...noteForm, fe: e.target.value })
              }
            />
            <Input
              placeholder="Appréciation"
              value={noteForm.appreciation}
              onChange={(e) =>
                setNoteForm({ ...noteForm, appreciation: e.target.value })
              }
            />

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveNote}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesEnseignant;
