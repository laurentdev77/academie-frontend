import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
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
   🔹 Constantes
   ============================================================ */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const NotesEnseignant: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
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
    score: 0,
    appreciation: "",
    session: "Normale",
  });

  const printRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ============================================================
     🧾 Impression PDF
     ============================================================ */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Notes du module",
  });

  /* ============================================================
     📚 Charger les modules de l’enseignant
     ============================================================ */
  const fetchModules = async () => {
    try {
      const res = await axios.get(`${API_BASE}/Modules/my`, { headers });
      setModules(res.data.data || []);
    } catch {
      toast.error("Erreur lors du chargement des modules.");
    }
  };

  /* ============================================================
     👨‍🎓 Charger les étudiants d’un module
     ============================================================ */
  const fetchStudents = async (moduleId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/students/by-module/${moduleId}`, { headers });
      setStudents(res.data || []);
    } catch {
      setStudents([]);
    }
  };

  /* ============================================================
     🧮 Charger les notes du module
     ============================================================ */
  const fetchNotes = async (moduleId: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/Notes/module/${moduleId}`, { headers });
      setNotes(res.data.data || []);
    } catch {
      toast.error("Erreur lors du chargement des notes.");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     💾 Ajouter ou modifier une note
     ============================================================ */
  const handleSaveNote = async () => {
    if (!noteForm.studentId) return toast.error("Veuillez sélectionner un étudiant.");
    if (!noteForm.moduleId) return toast.error("Veuillez sélectionner un module.");

    try {
      const endpoint = isEditing
        ? `${API_BASE}/Notes/module/${selectedModule}/${currentNoteId}`
        : `${API_BASE}/Notes/module/${selectedModule}/add`;
      const method = isEditing ? "put" : "post";
      await axios[method](endpoint, noteForm, { headers });
      toast.success(isEditing ? "Note modifiée avec succès." : "Note ajoutée avec succès !");
      setShowModal(false);
      fetchNotes(selectedModule);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    }
  };

  /* ============================================================
     ❌ Supprimer une note
     ============================================================ */
  const handleDelete = async (noteId?: string) => {
    if (!noteId || !confirm("Confirmer la suppression ?")) return;
    try {
      await axios.delete(`${API_BASE}/Notes/${noteId}`, { headers });
      toast.success("Note supprimée !");
      fetchNotes(selectedModule);
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  /* ============================================================
     ✏️ Préparer l’édition d’une note
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
     📤 Exporter PDF & Excel
     ============================================================ */
  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 60;
    doc.setFontSize(14);
    doc.text("Notes du module", 40, y);
    y += 30;
    notes.forEach((n) => {
      doc.text(`${n.student?.nom ?? ""} ${n.student?.prenom ?? ""} - ${n.score ?? ""}`, 40, y);
      y += 20;
    });
    doc.save("Notes_Module.pdf");
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
        Session: n.session ?? "Normale",
        Appréciation: n.appreciation,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Notes_Module_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* ============================================================
     ⚙️ Initialisation
     ============================================================ */
  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      setNoteForm((prev) => ({ ...prev, moduleId: selectedModule }));
      fetchNotes(selectedModule);
      fetchStudents(selectedModule);
    }
  }, [selectedModule]);

  /* ============================================================
     🖥️ Rendu principal
     ============================================================ */
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Notes des Elèves Officiers</h1>

        {/* ---------------------- Filtres et actions ---------------------- */}
        <div className="flex gap-2 mb-4 items-center">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">-- Sélectionner un module --</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.code})
              </option>
            ))}
          </select>

          <Button onClick={() => { setShowModal(true); setIsEditing(false); }}>Ajouter une note</Button>
          <Button onClick={exportPDF}>PDF</Button>
          <Button onClick={exportExcel}>Excel</Button>
          <Button onClick={handlePrint}>Imprimer</Button>
        </div>

        {/* ---------------------- Tableau des notes ---------------------- */}
        {loading ? (
          <div>Chargement des notes...</div>
        ) : (
          <div ref={printRef} className="bg-white border rounded shadow p-4">
            {notes.length === 0 ? (
              <div className="text-gray-500 text-center py-6">
                Aucune note pour ce module
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2">Nom</th>
                    <th className="px-3 py-2">Prénom</th>
                    <th className="px-3 py-2">Matricule</th>
                    <th className="px-3 py-2 text-center">EC</th>
                    <th className="px-3 py-2 text-center">EF</th>
                    <th className="px-3 py-2 text-center">Moyenne</th>
                    <th className="px-3 py-2 text-center">Session</th>
                    <th className="px-3 py-2">Appréciation</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((n) => (
                    <tr key={n.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{n.student?.nom}</td>
                      <td className="px-3 py-2">{n.student?.prenom}</td>
                      <td className="px-3 py-2">{n.student?.matricule}</td>
                      <td className="px-3 py-2 text-center">{n.ce ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{n.fe ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{n.score ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{n.session ?? "Normale"}</td>
                      <td className="px-3 py-2">{n.appreciation ?? ""}</td>
                      <td className="px-3 py-2 flex justify-center gap-2">
                        <Button size="sm" onClick={() => handleEdit(n)}>Modifier</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(n.id)}>
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ---------------------- Modal ---------------------- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-[400px]">
              <h2 className="text-lg font-semibold mb-3">
                {isEditing ? "Modifier la note" : "Ajouter une note"}
              </h2>

              <label className="block mb-1 text-sm font-medium">Étudiant</label>
              <select
                value={noteForm.studentId}
                onChange={(e) => setNoteForm({ ...noteForm, studentId: e.target.value })}
                className="border rounded w-full mb-3 p-2"
              >
                <option value="">-- Sélectionner un étudiant --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom} {s.prenom} ({s.matricule})
                  </option>
                ))}
              </select>

              <Input
                placeholder="Note EC"
                type="number"
                value={noteForm.ce}
                onChange={(e) => setNoteForm({ ...noteForm, ce: e.target.value })}
                className="mb-2"
              />
              <Input
                placeholder="Note EF"
                type="number"
                value={noteForm.fe}
                onChange={(e) => setNoteForm({ ...noteForm, fe: e.target.value })}
                className="mb-2"
              />
              <Input
                placeholder="Appréciation"
                value={noteForm.appreciation}
                onChange={(e) => setNoteForm({ ...noteForm, appreciation: e.target.value })}
                className="mb-4"
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveNote}>
                  {isEditing ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesEnseignant;
