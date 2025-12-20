import React, { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import api from "@/services/api"; // ✅ utilisation du service central

/* -------------------------
   Types
   ------------------------- */
interface ModuleShape {
  id: string;
  title: string;
  code: string;
  credits: number;
  semester: number;
}

interface StudentShape {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
}

interface NoteShape {
  id: string;
  ce: number;
  fe: number;
  score: number;
  appreciation?: string;
  session?: string;
  semester?: number;
  module?: ModuleShape;
  student?: StudentShape;
}

/* -------------------------
   Helpers
   ------------------------- */
const toNumber = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));
const format = (v: any) => (v !== null && v !== undefined ? Number(v).toFixed(2) : "-");

const computeAverage = (notes: NoteShape[]): number => {
  let totalWeighted = 0;
  let totalCredits = 0;
  for (const n of notes) {
    const cr = n.module?.credits ?? 0;
    totalWeighted += toNumber(n.score) * cr;
    totalCredits += cr;
  }
  return totalCredits > 0 ? parseFloat((totalWeighted / totalCredits).toFixed(2)) : 0;
};

/* -------------------------
   Component
   ------------------------- */
const NotesEtudiant: React.FC = () => {
  const [notes, setNotes] = useState<NoteShape[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ Détection automatique du semestre actif
  const currentMonth = new Date().getMonth() + 1;
  const defaultSemester = currentMonth <= 6 ? "S1" : "S2";
  const [viewMode, setViewMode] = useState<"S1" | "S2" | "AN">(defaultSemester as "S1" | "S2" | "AN");

  const printRef = useRef<HTMLDivElement | null>(null);

  /* -------------------------
     Impression PDF
     ------------------------- */
  const handlePrint = useReactToPrint({
    documentTitle: "Mes Notes",
    contentRef: printRef,
  });

  /* -------------------------
     Fetch notes
     ------------------------- */
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get("/notes/student/my"); // ✅ utilisation du service API

      const raw = Array.isArray(res.data.data) ? res.data.data : res.data || [];

      const normalized = raw.map((n: any) => {
        const sem =
          n.semester && Number(n.semester) > 0
            ? Number(n.semester)
            : n.module?.semester && Number(n.module.semester) > 0
            ? Number(n.module.semester)
            : 1;

        return {
          id: n.id,
          ce: toNumber(n.ce),
          fe: toNumber(n.fe),
          score: toNumber(n.score),
          appreciation: n.appreciation || "",
          session: n.session || "Normale",
          semester: sem,
          module: n.module
            ? {
                id: n.module.id,
                title: n.module.title,
                code: n.module.code,
                credits: n.module.credits,
                semester: sem,
              }
            : undefined,
          student: n.student,
        };
      });

      setNotes(normalized);
    } catch (err: any) {
      console.error("fetchNotes error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur lors du chargement des notes.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     Filtrage par semestre
     ------------------------- */
  const filteredNotes = useMemo(() => {
    if (viewMode === "AN") return notes;
    const semNum = viewMode === "S1" ? 1 : 2;
    return notes.filter((n) => Number(n.semester) === semNum);
  }, [notes, viewMode]);

  const moyenne = useMemo(() => computeAverage(filteredNotes), [filteredNotes]);
  const moyenneAnnuelle = useMemo(() => computeAverage(notes), [notes]);

  /* -------------------------
     Export PDF
     ------------------------- */
  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 60;
    doc.setFontSize(14);
    doc.text("Mes Notes - Étudiant", 40, y);
    y += 30;

    if (filteredNotes.length === 0) {
      doc.text("Aucune note disponible.", 40, y);
    } else {
      doc.setFontSize(10);
      doc.text("Module", 40, y);
      doc.text("Crédits", 200, y);
      doc.text("EC", 260, y);
      doc.text("EF", 310, y);
      doc.text("Moy.", 360, y);
      doc.text("Sem.", 420, y);
      y += 10;
      doc.line(40, y, 480, y);
      y += 15;

      filteredNotes.forEach((n) => {
        if (y > 750) {
          doc.addPage();
          y = 60;
        }
        doc.text(String(n.module?.title || "-"), 40, y);
        doc.text(String(n.module?.credits ?? "-"), 200, y);
        doc.text(format(n.ce), 260, y);
        doc.text(format(n.fe), 310, y);
        doc.text(format(n.score), 360, y);
        doc.text(String(n.semester ?? "-"), 420, y);
        y += 12;
      });
    }

    y += 20;
    doc.setFontSize(12);
    const label =
      viewMode === "AN"
        ? `Moyenne annuelle : ${moyenneAnnuelle.toFixed(2)}`
        : `Moyenne Semestre ${viewMode === "S1" ? "1" : "2"} : ${moyenne.toFixed(2)}`;
    doc.text(label, 40, y);
    doc.save(`Notes_${viewMode}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  /* -------------------------
     Export Excel
     ------------------------- */
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredNotes.map((n) => ({
        Module: n.module?.title,
        Code: n.module?.code,
        Crédits: n.module?.credits,
        EC: n.ce,
        EF: n.fe,
        Moyenne: n.score,
        Semestre: n.semester,
        Appréciation: n.appreciation,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `Notes_${viewMode}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Mes Notes</h1>
          <div className="flex gap-2 flex-wrap">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "S1" | "S2" | "AN")}
              className="border rounded px-2 py-1"
            >
              <option value="S1">Semestre 1</option>
              <option value="S2">Semestre 2</option>
              <option value="AN">Année complète</option>
            </select>
            <Button onClick={fetchNotes}>Actualiser</Button>
            <Button onClick={exportPDF}>Export PDF</Button>
            <Button onClick={exportExcel}>Export Excel</Button>
            <Button onClick={handlePrint} variant="outline">
              Imprimer
            </Button>
          </div>
        </div>

        {errorMsg && <div className="text-red-600 mb-3">{errorMsg}</div>}

        {loading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : (
          <div ref={printRef} className="bg-white border rounded shadow-sm p-4">
            {filteredNotes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Aucune note disponible</div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Module</th>
                    <th className="px-3 py-2 text-center">Code</th>
                    <th className="px-3 py-2 text-center">Crédits</th>
                    <th className="px-3 py-2 text-center">EC</th>
                    <th className="px-3 py-2 text-center">EF</th>
                    <th className="px-3 py-2 text-center">Moyenne</th>
                    <th className="px-3 py-2 text-center">Semestre</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.map((n) => (
                    <tr key={n.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{n.module?.title ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{n.module?.code ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{n.module?.credits ?? 0}</td>
                      <td
                        className={`px-3 py-2 text-center font-semibold ${
                          n.ce >= 10 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {format(n.ce)}
                      </td>
                      <td
                        className={`px-3 py-2 text-center font-semibold ${
                          n.fe >= 10 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {format(n.fe)}
                      </td>
                      <td
                        className={`px-3 py-2 text-center font-semibold ${
                          n.score >= 10 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {format(n.score)}
                      </td>
                      <td className="px-3 py-2 text-center">{n.semester ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4 text-right font-semibold">
              {viewMode === "AN" ? (
                <span>Moyenne annuelle : {moyenneAnnuelle.toFixed(2)}</span>
              ) : (
                <span>
                  Moyenne semestre {viewMode === "S1" ? "1" : "2"} : {moyenne.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesEtudiant;
