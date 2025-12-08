import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import Logo from "@/assets/logoacademie.png";

/* ------------------------- Types ------------------------- */
interface ModuleShape {
  id: string;
  title?: string;
  code?: string;
  credits?: number;
  semester?: number;
}

interface StudentShape {
  id: string;
  nom: string;
  prenom?: string;
  matricule?: string;
  promotionId?: number | null;
  promotion?: {
    id: number;
    nom: string;
    annee: number;
  } | null;
}

interface NoteShape {
  id: string;
  studentId: string;
  moduleId: string;
  session?: string;
  ce?: number;
  fe?: number;
  score: number;
  appreciation?: string;
  semester?: number;
  module?: ModuleShape | null;
  student?: StudentShape | null;
}

/* ------------------------- Utils ------------------------- */
const toNumberSafe = (v: any): number | undefined => {
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const computeWeightedAverage = (notes: NoteShape[]): number => {
  let totalCredits = 0;
  let weightedSum = 0;
  for (const n of notes) {
    const credits = n.module?.credits ?? 0;
    weightedSum += (n.score ?? 0) * credits;
    totalCredits += credits;
  }
  return totalCredits === 0 ? 0 : parseFloat((weightedSum / totalCredits).toFixed(2));
};

const moduleMention = (score: number): string => {
  if (score >= 16) return "Excellent";
  if (score >= 14) return "Très bien";
  if (score >= 12) return "Bien";
  if (score >= 10) return "Passable";
  return "Insuffisant";
};

const annualMention = (score: number): string => {
  if (score >= 16) return "Excellent";
  if (score >= 14) return "Très bien";
  if (score >= 12) return "Bien";
  if (score >= 10) return "Passable";
  return "Insuffisant";
};

const decisionLMD = (annual: number, sem1: number, sem2: number) => {
  if (annual >= 10) return "Validé";
  if (annual >= 9.5 && (sem1 >= 12 || sem2 >= 12)) return "Validé (compensation)";
  return "Ajourné";
};

/* ------------------------- Component ------------------------- */
const MonBulletin: React.FC = () => {
  const printRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [notes, setNotes] = useState<NoteShape[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const defaultView = currentMonth >= 1 && currentMonth <= 6 ? "S2" : "S1";
  type ViewMode = "S1" | "S2" | "ANNUEL";
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  /* ---- Impression ---- */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Bulletin Académique Officiel",
  });

  /* ---- Fetch notes ---- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/Notes/student/my", { headers });
        const raw = res.data?.data || [];

        const normalized = raw.map((n: any): NoteShape => ({
          id: n.id,
          studentId: n.studentId,
          moduleId: n.moduleId,
          session: n.session ?? "Normale",
          ce: toNumberSafe(n.ce),
          fe: toNumberSafe(n.fe),
          score: Number(n.score ?? 0),
          appreciation: n.appreciation ?? "",
          semester: n.semester ?? n.module?.semester ?? 1,
          module: n.module
            ? {
                id: n.module.id,
                title: n.module.title,
                code: n.module.code,
                credits: n.module.credits ?? 0,
                semester: n.module.semester ?? 1,
              }
            : null,
          student: n.student
            ? {
                id: n.student.id,
                nom: n.student.nom ?? "",
                prenom: n.student.prenom ?? "",
                matricule: n.student.matricule ?? "",
                promotionId: n.student.promotionId ?? null,
                promotion: n.student.promotion ?? null,
              }
            : null,
        }));

        setNotes(normalized);
      } catch (err: any) {
        console.error("fetchNotes error:", err);
        setErrorMsg(err.response?.data?.message ?? "Erreur de chargement des notes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---- Calculs ---- */
  const notesS1 = useMemo(() => notes.filter((n) => n.semester === 1), [notes]);
  const notesS2 = useMemo(() => notes.filter((n) => n.semester === 2), [notes]);
  const moyS1 = computeWeightedAverage(notesS1);
  const moyS2 = computeWeightedAverage(notesS2);
  const moyAnnuel = computeWeightedAverage([...notesS1, ...notesS2]);
  const decision = decisionLMD(moyAnnuel, moyS1, moyS2);

  /* ---- Exports ---- */
  const exportPDF = () => {
    const student = notes[0]?.student;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ACADEMIE MILITAIRE", 20, 20);
    doc.setFontSize(12);
    doc.text("Bulletin Académique Officiel", 20, 30);

    if (student) {
      doc.text(`Nom : ${student.nom} ${student.prenom}`, 20, 50);
      doc.text(`Matricule : ${student.matricule}`, 20, 60);
    }

    doc.text(`Moyenne annuelle : ${moyAnnuel.toFixed(2)} — ${annualMention(moyAnnuel)}`, 20, 80);
    doc.text(`Décision : ${decision}`, 20, 90);

    doc.text(`Fait à Kinshasa, le ${new Date().toLocaleDateString("fr-FR")}`, 20, 110);
    doc.text("Le Directeur Académique", 130, 140);
    doc.save(`Bulletin_${student?.matricule ?? "etudiant"}.pdf`);
  };

  const exportExcel = () => {
    const headers = ["Module", "Code", "Crédits", "Sem", "EC", "EF", "Moy.", "Mention", "Session", "Appréciation"];
    const selected =
      viewMode === "S1" ? notesS1 : viewMode === "S2" ? notesS2 : [...notesS1, ...notesS2];

    const data = selected.map((n) => [
      n.module?.title,
      n.module?.code,
      n.module?.credits,
      n.semester,
      n.ce,
      n.fe,
      n.score,
      moduleMention(n.score),
      n.session,
      n.appreciation,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulletin");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "Mon_Bulletin.xlsx");
  };

  /* ---- Render ---- */
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Mon Bulletin Académique</h1>

        {errorMsg && <p className="text-red-600 mb-3">{errorMsg}</p>}
        {loading && <p>Chargement...</p>}

        <div className="flex gap-3 mb-4">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="border rounded px-2 py-1"
          >
            <option value="S1">Semestre 1</option>
            <option value="S2">Semestre 2</option>
            <option value="ANNUEL">Annuel</option>
          </select>

          <Button onClick={handlePrint}>Imprimer</Button>
          <Button onClick={exportPDF}>Export PDF</Button>
          <Button onClick={exportExcel}>Export Excel</Button>
        </div>

        <div ref={printRef} className="bg-white p-6 border rounded shadow text-sm">
          {/* --- En-tête --- */}
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <img src={Logo} alt="logo" className="w-20" />
            <div className="text-center flex-1">
              <h2 className="font-bold text-lg">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h2>
              <p>MINISTÈRE DE LA DÉFENSE NATIONALE</p>
              <p className="font-semibold">ACADEMIE MILITAIRE</p>
              <p className="text-gray-500">Bulletin Académique Officiel</p>
            </div>
            <div className="w-20" />
          </div>

          {/* --- Informations étudiant --- */}
          <div className="mb-3">
            <p><b>Nom :</b> {notes[0]?.student?.nom} {notes[0]?.student?.prenom}</p>
            <p><b>Matricule :</b> {notes[0]?.student?.matricule ?? "-"}</p>
            <p><b>Année académique :</b>{" "}
              {new Date().getFullYear() - 1} - {new Date().getFullYear()}
            </p>
            <p><b>Mention annuelle :</b> {annualMention(moyAnnuel)}</p>
          </div>

          {/* --- Moyennes --- */}
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="border p-2 rounded text-center">Moy. S1: <b>{moyS1.toFixed(2)}</b></div>
            <div className="border p-2 rounded text-center">Moy. S2: <b>{moyS2.toFixed(2)}</b></div>
            <div className="border p-2 rounded text-center">Annuel: <b>{moyAnnuel.toFixed(2)}</b></div>
          </div>

          <p className="mb-4"><b>Décision :</b> {decision}</p>

          {/* --- Tableau des notes --- */}
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1">Module</th>
                <th className="px-2 py-1">Code</th>
                <th className="px-2 py-1">Crédits</th>
                <th className="px-2 py-1">Sem</th>
                <th className="px-2 py-1">EC</th>
                <th className="px-2 py-1">EF</th>
                <th className="px-2 py-1">Moy.</th>
                <th className="px-2 py-1">Mention</th>
                <th className="px-2 py-1">Session</th>
                <th className="px-2 py-1">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {(viewMode === "S1"
                ? notesS1
                : viewMode === "S2"
                ? notesS2
                : [...notesS1, ...notesS2]
              ).map((n) => (
                <tr key={n.id} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-1">{n.module?.title}</td>
                  <td className="px-2 py-1 text-center">{n.module?.code}</td>
                  <td className="px-2 py-1 text-center">{n.module?.credits}</td>
                  <td className="px-2 py-1 text-center">{n.semester}</td>

                  {/* EC */}
                  <td className={`px-2 py-1 text-center font-semibold ${
                    (n.ce ?? 0) >= 10 ? "text-green-700" : "text-red-600"
                  }`}>
                    {n.ce ?? "-"}
                  </td>

                  {/* EF */}
                  <td className={`px-2 py-1 text-center font-semibold ${
                    (n.fe ?? 0) >= 10 ? "text-green-700" : "text-red-600"
                  }`}>
                    {n.fe ?? "-"}
                  </td>

                  {/* MOY */}
                  <td className={`px-2 py-1 text-center font-semibold ${
                    n.score >= 10 ? "text-green-700" : "text-red-600"
                  }`}>
                    {n.score.toFixed(2)}
                  </td>

                  {/* MENTION */}
                  <td className="px-2 py-1 text-center font-semibold">
                    {moduleMention(n.score)}
                  </td>

                  <td className="px-2 py-1 text-center">{n.session}</td>
                  <td className="px-2 py-1">{n.appreciation ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* --- Signature officielle --- */}
          <div className="mt-10 flex justify-between items-end">
            <div>
              <p>Fait à Kananga, le {new Date().toLocaleDateString("fr-FR")}</p>
              <p className="mt-6 font-semibold">Le Secrétaire Académique</p>
              <div className="mt-8 border-t-2 w-48 border-gray-600"></div>
            </div>

            <div className="text-right">
              <p className="italic text-gray-600">Cachet officiel</p>
              <div className="mt-8 border border-gray-400 w-32 h-32 rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonBulletin;
