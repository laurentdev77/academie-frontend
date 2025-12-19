// src/pages/dashboard/Bulletins.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/axiosConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LucideDownload,
  LucideFileText,
  LucideRefreshCw,
  LucidePrinter,
  LucideFileSpreadsheet,
} from "lucide-react";
import { jsPDF } from "jspdf";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* -------------------------
   Types / Interfaces
   ------------------------- */
interface Promotion {
  id: number | string;
  nom: string;
}

interface Student {
  id: string;
  matricule?: string;
  nom: string;
  prenom?: string;
  promotionId?: number | string | null;
  // autres champs...
}

interface Module {
  id: string;
  title: string;
  code?: string;
  credits: number;
  semester?: number; // 1 or 2
  coefficient?: number;
}

interface Note {
  id: string;
  studentId: string;
  moduleId: string;
  session: string;
  continuousAssessment?: number | null; // EC
  finalExam?: number | null; // EF
  score: number; // final score (0-20)
  appreciation?: string;
  createdAt?: string;
  module?: Module | null;
  student?: Student | null;
}

/* -------------------------
   Utilitaires académiques
   ------------------------- */

function computeMention(score: number): string {
  if (score < 10) return "Ajourné";
  if (score < 12) return "Passable";
  if (score < 14) return "Assez bien";
  if (score < 16) return "Bien";
  if (score < 18) return "Très bien";
  return "Excellent";
}

function computeWeightedAverage(notes: Note[]): {
  avg: number;
  totalWeight: number;
  totalCredits: number;
  weightedSum: number;
} {
  let weightedSum = 0;
  let totalWeight = 0;
  let totalCredits = 0;

  for (const n of notes) {
    const credits = Number(n.module?.credits ?? 0) || 0;
    const coeff = Number((n.module as any)?.coefficient ?? 1) || 1;
    const weight = credits > 0 ? credits * coeff : coeff > 0 ? coeff : 0;

    const score = Number(n.score ?? 0) || 0;

    if (weight > 0) {
      weightedSum += score * weight;
      totalWeight += weight;
    }

    totalCredits += credits;
  }

  const avg = totalWeight === 0 ? 0 : parseFloat((weightedSum / totalWeight).toFixed(2));
  return { avg, totalWeight, totalCredits, weightedSum };
}

function decisionFromAverage(avg: number): string {
  return avg >= 10 ? "Validé" : "Ajourné";
}

/* -------------------------
   Composant principal
   ------------------------- */
const BulletinsPage: React.FC = () => {

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [selectedPromotion, setSelectedPromotion] = useState<number | "all">("all");
  const [selectedSemester, setSelectedSemester] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  // preview modal
  const [openPreview, setOpenPreview] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Chargement initial : promotions, students, modules, notes
   * Robust fallback : noteRes.data?.data OR noteRes.data
   */
  const fetchAll = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      
      // NOTE: on utilise uniquement /api/notes (backend renvoie { message, data })
      const [promRes, studRes, modRes, noteRes] = await Promise.all([
  api.get("/promotions"),
  api.get("/students"),
  api.get("/modules"),
  api.get("/notes"),
]);

      // robust extraction (supporte plusieurs formats: {data: [...]}, [...], {notes: [...]})
      const promData: Promotion[] =
        Array.isArray(promRes.data) ? promRes.data : promRes.data?.data ?? promRes.data?.promotions ?? [];
      const studData: Student[] =
        Array.isArray(studRes.data) ? studRes.data : studRes.data?.data ?? studRes.data?.students ?? [];
      const modDataRaw: any[] =
        Array.isArray(modRes.data) ? modRes.data : modRes.data?.data ?? modRes.data?.modules ?? [];
      const noteDataRaw: any[] =
        Array.isArray(noteRes.data) ? noteRes.data : noteRes.data?.data ?? noteRes.data?.notes ?? [];

      // normalise modules
      const modData: Module[] = modDataRaw.map((m: any) => ({
        id: m.id,
        title: m.title ?? m.name ?? m.code ?? "Module",
        code: m.code ?? undefined,
        credits: Number(m.credits ?? 0) || 0,
        semester: m.semester ? Number(m.semester) : undefined,
        coefficient: m.coefficient ? Number(m.coefficient) : (m.coefficient === 0 ? 0 : 1),
      }));

      const moduleById: Record<string, Module> = {};
      for (const m of modData) moduleById[m.id] = m;

      // normalize notes
      const normalizedNotes: Note[] = noteDataRaw.map((n: any) => {
        const ce =
          typeof n.ce === "number"
            ? n.ce
            : typeof n.continuousAssessment === "number"
            ? n.continuousAssessment
            : n.ce
            ? Number(n.ce)
            : n.continuousAssessment
            ? Number(n.continuousAssessment)
            : undefined;

        const fe =
          typeof n.fe === "number"
            ? n.fe
            : typeof n.finalExam === "number"
            ? n.finalExam
            : n.fe
            ? Number(n.fe)
            : n.finalExam
            ? Number(n.finalExam)
            : undefined;

        const score =
          typeof n.score === "number"
            ? n.score
            : n.score
            ? Number(n.score)
            : ce != null || fe != null
            ? Number(((Number(ce || 0) * 0.4) + (Number(fe || 0) * 0.6)).toFixed(2))
            : 0;

        const moduleFromPayload = n.module
          ? {
              id: n.module.id,
              title: n.module.title ?? n.module.name ?? n.module.code ?? "",
              code: n.module.code,
              credits: Number(n.module.credits ?? 0) || 0,
              semester: n.module.semester ? Number(n.module.semester) : undefined,
              coefficient: n.module.coefficient ? Number(n.module.coefficient) : (n.module.coefficient === 0 ? 0 : 1),
            }
          : moduleById[n.moduleId] ?? null;

        const studentFromPayload = n.student ?? null;

        return {
          id: n.id,
          studentId: n.studentId,
          moduleId: n.moduleId,
          session: n.session ?? n.sessionType ?? "Normale",
          continuousAssessment: ce != null ? Number(ce) : undefined,
          finalExam: fe != null ? Number(fe) : undefined,
          score: Number(score ?? 0),
          appreciation: n.appreciation ?? n.noteAppreciation ?? "",
          createdAt: n.createdAt,
          module: moduleFromPayload,
          student: studentFromPayload,
        } as Note;
      });

      setPromotions(promData);
      setStudents(studData);
      setModules(modData);
      setNotes(normalizedNotes);
    } catch (err: any) {
      console.error("fetchAll bulletins:", err);
      setErrorMsg(err?.response?.data?.message || "Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     Filtrer étudiants
     ------------------------- */
  const studentsFiltered = useMemo(() => {
    return students.filter((s) => {
      if (selectedPromotion !== "all" && s.promotionId !== selectedPromotion) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const fullname = `${s.nom} ${s.prenom ?? ""}`.toLowerCase();
      return fullname.includes(q) || (s.matricule ?? "").toLowerCase().includes(q);
    });
  }, [students, selectedPromotion, search]);

  const totalPages = Math.max(1, Math.ceil(studentsFiltered.length / perPage));
  const displayedStudents = studentsFiltered.slice((page - 1) * perPage, page * perPage);

  /* -------------------------
     Notes utilitaires
     ------------------------- */

  // Toutes les notes d'un étudiant, en attachant module si nécessaire
  const getNotesForStudent = (studentId: string): Note[] => {
    return notes
      .filter((n) => n.studentId === studentId)
      .map((n) => {
        if (!n.module) {
          const m = modules.find((mm) => mm.id === n.moduleId);
          const safeM: Module | null = m
            ? {
                id: m.id,
                title: (m as any).title ?? (m as any).name ?? (m as any).code ?? "",
                code: (m as any).code,
                credits: Number((m as any).credits ?? 0) || 0,
                semester: (m as any).semester ? Number((m as any).semester) : undefined,
                coefficient: (m as any).coefficient ? Number((m as any).coefficient) : 1,
              }
            : null;
          return { ...n, module: safeM };
        }
        return n;
      });
  };

  const getNotesForStudentBySemester = (studentId: string, semester: number | "all"): Note[] => {
    const all = getNotesForStudent(studentId);
    if (semester === "all") return all;
    return all.filter((n) => Number(n.module?.semester ?? 0) === Number(semester));
  };

  const computeSemesterStats = (studentId: string, semester: number | "all") => {
    const semesterNotes = getNotesForStudentBySemester(studentId, semester);
    return computeWeightedAverage(semesterNotes);
  };

  const computeAnnualStats = (studentId: string, semesterFilter: number | "all" = "all") => {
    if (semesterFilter !== "all") {
      return computeWeightedAverage(getNotesForStudentBySemester(studentId, semesterFilter));
    }
    return computeWeightedAverage(getNotesForStudent(studentId));
  };

  /* -------------------------
     Export single PDF (jsPDF)
     ------------------------- */
  const exportStudentPDF = async (student: Student) => {
    try {
      const stNotes = getNotesForStudent(student.id);
      const { avg: annualAvg } = computeAnnualStats(student.id);
      const mention = computeMention(annualAvg);
      const decision = decisionFromAverage(annualAvg);

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      let y = 60;

      doc.setFontSize(14);
      doc.text("Académie Militaire — Bulletin de notes", margin, y);
      y += 18;
      doc.setFontSize(11);
      doc.text(`Elève Officier: ${student.nom} ${student.prenom ?? ""}`, margin, y);
      y += 14;
      doc.text(`Matricule: ${student.matricule ?? "—"}`, margin, y);
      y += 14;
      const promName = promotions.find((p) => p.id === student.promotionId)?.nom ?? "—";
      doc.text(`Promotion: ${promName}`, margin, y);
      y += 18;

      for (const sem of [1, 2]) {
        const semNotes = getNotesForStudentBySemester(student.id, sem);
        doc.setFontSize(12);
        doc.text(`Semestre ${sem}`, margin, y);
        y += 14;

        if (semNotes.length === 0) {
          doc.setFontSize(10);
          doc.text("Aucune note enregistrée pour ce semestre.", margin, y);
          y += 16;
          continue;
        }

        doc.setFontSize(10);
        doc.text("Module", margin, y);
        doc.text("Crédits", margin + 220, y);
        doc.text("Session", margin + 290, y);
        doc.text("EC", margin + 350, y);
        doc.text("EF", margin + 395, y);
        doc.text("Moy.", margin + 435, y);
        doc.text("Mention", margin + 485, y);
        y += 8;
        doc.line(margin, y, 560, y);
        y += 12;

        for (const n of semNotes) {
          if (y > 740) {
            doc.addPage();
            y = 60;
          }
          const moduleTitle = n.module?.title ?? n.moduleId;
          const credits = Number(n.module?.credits ?? 0) || 0;
          const coeff = Number(n.module?.coefficient ?? 1) || 1;
          const weight = credits > 0 ? credits * coeff : coeff > 0 ? coeff : 0;
          const ec = n.continuousAssessment != null ? Number(n.continuousAssessment).toFixed(2) : "-";
          const ef = n.finalExam != null ? Number(n.finalExam).toFixed(2) : "-";
          const moy = Number(n.score ?? 0).toFixed(2);
          const mentionRow = computeMention(Number(n.score ?? 0));

          doc.text(String(moduleTitle), margin, y, { maxWidth: 200 });
          doc.text(String(credits), margin + 220, y);
          doc.text(n.session ?? "-", margin + 290, y);
          doc.text(String(ec), margin + 350, y);
          doc.text(String(ef), margin + 395, y);
          doc.text(moy, margin + 435, y);
          doc.text(mentionRow, margin + 485, y);

          y += 14;
        }

        const { avg: semAvg, totalWeight: semTotalWeight } = computeSemesterStats(student.id, sem);
        y += 8;
        doc.text(`Moyenne Semestre ${sem}: ${semAvg.toFixed(2)} / 20`, margin, y);
        doc.text(`Poids évalués: ${semTotalWeight}`, margin + 260, y);
        y += 16;
      }

      y += 6;
      doc.line(margin, y, 560, y);
      y += 12;
      doc.setFontSize(11);
      const annual = computeAnnualStats(student.id);
      doc.text(`Poids totaux évalués: ${annual.totalWeight}`, margin, y);
      y += 14;
      doc.text(`Moyenne annuelle pondérée: ${annual.avg.toFixed(2)} / 20`, margin, y);
      y += 14;
      doc.text(`Mention finale: ${computeMention(annual.avg)}`, margin, y);
      y += 14;
      doc.text(`Décision: ${decision}`, margin, y);
      y += 10;

      const generalApp = stNotes.map((n) => n.appreciation).filter(Boolean).join(" ; ");
      if (generalApp) {
        y += 14;
        doc.text("Appréciations :", margin, y);
        y += 10;
        doc.text(generalApp, margin, y, { maxWidth: 520 });
      }

      const safeName = (student.matricule ?? student.nom ?? "student").replace(/\s+/g, "_");
      const fileName = `Bulletin_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      setSuccessMsg("PDF généré");
    } catch (err: any) {
      console.error("exportStudentPDF error:", err);
      setErrorMsg("Erreur lors de la génération du PDF.");
    }
  };

  /* -------------------------
     Export Batch PDF
  ------------------------- */
  const exportBatchPDF = async (studentsToExport: Student[]) => {
    try {
      if (!studentsToExport.length) {
        setErrorMsg("Aucun étudiant à exporter.");
        return;
      }
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      for (let idx = 0; idx < studentsToExport.length; idx++) {
        const st = studentsToExport[idx];
        if (idx > 0) doc.addPage();

        let y = 60;
        doc.setFontSize(14);
        doc.text("Académie Militaire — Bulletin de notes", 40, y);
        y += 18;
        doc.setFontSize(11);
        doc.text(`Étudiant: ${st.nom} ${st.prenom ?? ""}`, 40, y);
        y += 14;
        doc.text(`Matricule: ${st.matricule ?? "—"}`, 40, y);
        y += 14;
        const promName = promotions.find((p) => p.id === st.promotionId)?.nom ?? "—";
        doc.text(`Promotion: ${promName}`, 40, y);
        y += 18;

        const stNotes = getNotesForStudent(st.id);
        doc.setFontSize(10);
        doc.text("Module", 40, y);
        doc.text("EC", 260, y);
        doc.text("EF", 320, y);
        doc.text("Moy.", 380, y);
        doc.text("Crédits", 440, y);
        y += 10;
        doc.line(40, y, 560, y);
        y += 12;

        for (const n of stNotes) {
          if (y > 740) {
            doc.addPage();
            y = 60;
          }
          const moduleTitle = n.module?.title ?? n.moduleId;
          doc.text(String(moduleTitle).slice(0, 30), 40, y);
          doc.text(n.continuousAssessment != null ? String(Number(n.continuousAssessment).toFixed(2)) : "-", 260, y);
          doc.text(n.finalExam != null ? String(Number(n.finalExam).toFixed(2)) : "-", 320, y);
          doc.text((Number(n.score ?? 0)).toFixed(2), 380, y);
          doc.text(String(n.module?.credits ?? 0), 440, y);
          y += 12;
        }

        const annual = computeAnnualStats(st.id);
        y += 10;
        doc.text(`Moy. pondérée: ${annual.avg.toFixed(2)}`, 40, y);
        y += 12;
      }

      const fileName = `Bulletins_Batch_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      setSuccessMsg("PDF batch généré");
    } catch (err: any) {
      console.error("exportBatchPDF error:", err);
      setErrorMsg("Erreur lors de la génération du PDF batch.");
    }
  };

  /* -------------------------
     Export Excel .xlsx
  ------------------------- */
  const exportExcel = (studentsToExport: Student[]) => {
    try {
      const rows: any[] = [];
      for (const st of studentsToExport) {
        const stNotes = getNotesForStudent(st.id);
        const annual = computeAnnualStats(st.id);
        if (stNotes.length === 0) {
          rows.push({
            Matricule: st.matricule ?? "",
            Etudiant: `${st.nom} ${st.prenom ?? ""}`,
            Promotion: promotions.find((p) => p.id === st.promotionId)?.nom ?? "",
            Module: "",
            Code: "",
            Credits: "",
            Semestre: "",
            Session: "",
            EC: "",
            EF: "",
            Score: "",
            Appreciation: "",
            "Moy. annuelle pondérée": annual.avg,
            "Poids totaux": annual.totalWeight,
          });
        } else {
          for (const n of stNotes) {
            rows.push({
              Matricule: st.matricule ?? "",
              Etudiant: `${st.nom} ${st.prenom ?? ""}`,
              Promotion: promotions.find((p) => p.id === st.promotionId)?.nom ?? "",
              Module: n.module?.title ?? "",
              Code: n.module?.code ?? "",
              Credits: n.module?.credits ?? 0,
              Semestre: n.module?.semester ?? "",
              Session: n.session ?? "",
              EC: n.continuousAssessment ?? "",
              EF: n.finalExam ?? "",
              Score: n.score ?? "",
              Appreciation: n.appreciation ?? "",
              "Moy. annuelle pondérée": annual.avg,
              "Poids totaux": annual.totalWeight,
            });
          }
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bulletins");
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Bulletins_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setSuccessMsg("Export Excel généré");
    } catch (err: any) {
      console.error("exportExcel error:", err);
      setErrorMsg("Erreur lors de l'export Excel.");
    }
  };

  /* -------------------------
     Print preview
  ------------------------- */
  const openPreviewFor = (student: Student) => {
    setPreviewStudent(student);
    setOpenPreview(true);
  };

  const closePreview = () => {
    setPreviewStudent(null);
    setOpenPreview(false);
  };

  const printPreview = () => {
    if (!previewStudent) return;
    const stNotes = getNotesForStudent(previewStudent.id);
    const annual = computeAnnualStats(previewStudent.id);

    const html = `
      <html>
        <head>
          <title>Bulletin - ${previewStudent.nom}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>Académie Militaire — Bulletin</h2>
          <p><strong>Étudiant:</strong> ${previewStudent.nom} ${previewStudent.prenom ?? ""}</p>
          <p><strong>Matricule:</strong> ${previewStudent.matricule ?? ""}</p>
          <p><strong>Promotion:</strong> ${promotions.find((p) => p.id === previewStudent.promotionId)?.nom ?? ""}</p>
          <table>
            <thead>
              <tr>
                <th>Module</th><th>EC</th><th>EF</th><th>Moy</th><th>Crédits</th>
              </tr>
            </thead>
            <tbody>
              ${stNotes.map(n => `<tr>
                <td>${(n.module?.title ?? "")}</td>
                <td>${n.continuousAssessment ?? "-"}</td>
                <td>${n.finalExam ?? "-"}</td>
                <td>${(Number(n.score ?? 0)).toFixed(2)}</td>
                <td>${n.module?.credits ?? 0}</td>
              </tr>`).join("")}
            </tbody>
          </table>
          <p><strong>Moyenne annuelle pondérée:</strong> ${annual.avg.toFixed(2)}</p>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  };

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl">Bulletins des Elèves Officiers</CardTitle>

          <div className="flex items-center gap-2">
            <select
              value={selectedPromotion}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedPromotion(v === "all" ? "all" : Number(v));
                setPage(1);
              }}
              className="border rounded px-2 py-2"
            >
              <option value="all">— Toutes les promotions —</option>
              {promotions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedSemester(v === "all" ? "all" : Number(v));
                setPage(1);
              }}
              className="border rounded px-2 py-2"
            >
              <option value="all">— Tous semestres —</option>
              <option value={1}>Semestre 1</option>
              <option value={2}>Semestre 2</option>
            </select>

            <Input
              placeholder="Rechercher Elève Officier ou matricule..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-72"
            />

            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              <LucideRefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>

            <Button variant="ghost" onClick={() => exportExcel(displayedStudents)} title="Export Excel">
              <LucideFileSpreadsheet className="w-4 h-4 mr-1" /> Export Excel
            </Button>

            <Button onClick={() => exportBatchPDF(displayedStudents)} className="bg-green-600 text-white" title="Exporter PDF (lot)">
              <LucideDownload className="w-4 h-4 mr-1" /> Export PDF (lot)
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
          {successMsg && <p className="text-green-600 mb-2">{successMsg}</p>}

          {loading ? (
            <p>Chargement...</p>
          ) : displayedStudents.length === 0 ? (
            <p>Aucun Elève Officier trouvé pour cette sélection.</p>
          ) : (
            <div className="overflow-x-auto border bg-white rounded-md">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Matricule</th>
                    <th className="px-4 py-2 text-left">Elève Officier</th>
                    <th className="px-4 py-2 text-left">Moy. S1</th>
                    <th className="px-4 py-2 text-left">Moy. S2</th>
                    <th className="px-4 py-2 text-left">Moy. annuelle</th>
                    <th className="px-4 py-2 text-left">Mention</th>
                    <th className="px-4 py-2 text-left">Décision</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedStudents.map((s) => {
                    const s1 = computeSemesterStats(s.id, 1);
                    const s2 = computeSemesterStats(s.id, 2);
                    const annual = computeAnnualStats(s.id, selectedSemester === "all" ? "all" : selectedSemester);
                    const mention = computeMention(annual.avg);
                    const decision = decisionFromAverage(annual.avg);

                    return (
                      <tr key={s.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">{s.matricule ?? "—"}</td>
                        <td className="px-4 py-2">{`${s.nom} ${s.prenom ?? ""}`}</td>
                        <td className="px-4 py-2 text-center">{s1.totalWeight === 0 ? "—" : s1.avg.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">{s2.totalWeight === 0 ? "—" : s2.avg.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center font-semibold">{annual.totalWeight === 0 ? "—" : annual.avg.toFixed(2)}</td>
                        <td className="px-4 py-2">{mention}</td>
                        <td className="px-4 py-2">{decision}</td>
                        <td className="px-4 py-2 text-center flex justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openPreviewFor(s)}>
                            <LucideFileText className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => exportStudentPDF(s)}>
                            <LucideDownload className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => { openPreviewFor(s); setTimeout(() => printPreview(), 300); }}>
                            <LucidePrinter className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded ${page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Preview bulletin */}
      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview bulletin</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {previewStudent ? (
              <>
                <div>
                  <strong>{previewStudent.nom} {previewStudent.prenom ?? ""}</strong>{" "}
                  — {previewStudent.matricule ?? ""}
                  <div className="text-sm text-gray-500">Promotion: {promotions.find((p) => p.id === previewStudent.promotionId)?.nom ?? "—"}</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Module</th>
                        <th className="px-3 py-2 text-left">Crédits</th>
                        <th className="px-3 py-2 text-left">Sem.</th>
                        <th className="px-3 py-2 text-left">Session</th>
                        <th className="px-3 py-2 text-left">EC</th>
                        <th className="px-3 py-2 text-left">EF</th>
                        <th className="px-3 py-2 text-left">Moy.</th>
                        <th className="px-3 py-2 text-left">Mention</th>
                        <th className="px-3 py-2 text-left">Pondéré</th>
                        <th className="px-3 py-2 text-left">Appréciation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getNotesForStudent(previewStudent.id).map((n) => {
                        const credits = Number(n.module?.credits ?? 0) || 0;
                        const coeff = Number(n.module?.coefficient ?? 1) || 1;
                        const weight = credits > 0 ? credits * coeff : coeff > 0 ? coeff : 0;
                        const mention = computeMention(Number(n.score ?? 0));
                        const weightedContribution = Number((Number(n.score ?? 0) * weight).toFixed(2));
                        return (
                          <tr key={n.id} className="border-t">
                            <td className="px-3 py-2">{n.module?.title ?? "—"}</td>
                            <td className="px-3 py-2 text-center">{credits}</td>
                            <td className="px-3 py-2 text-center">{n.module?.semester ?? "—"}</td>
                            <td className="px-3 py-2">{n.session}</td>
                            <td className="px-3 py-2 text-center">{n.continuousAssessment ?? "—"}</td>
                            <td className="px-3 py-2 text-center">{n.finalExam ?? "—"}</td>
                            <td className="px-3 py-2">{Number(n.score ?? 0).toFixed(2)}</td>
                            <td className="px-3 py-2">{mention}</td>
                            <td className="px-3 py-2 text-center">{weight > 0 ? weightedContribution : "—"}</td>
                            <td className="px-3 py-2">{n.appreciation ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3">
                  <strong>Résumé :</strong>
                  <div>
                    {(() => {
                      const sNotes = getNotesForStudent(previewStudent.id);
                      const { avg, totalWeight, totalCredits } = computeWeightedAverage(sNotes);
                      return (
                        <>
                          Moyenne pondérée: <strong>{avg.toFixed(2)}</strong> /20 — Poids total :
                          <strong> {totalWeight}</strong> — Crédits total: <strong>{totalCredits}</strong> — Mention: <strong>{computeMention(avg)}</strong> — Décision:
                          <strong> {decisionFromAverage(avg)}</strong>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <p>Aucun Elève Officier sélectionné.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePreview}>Fermer</Button>
            <Button onClick={() => { if (previewStudent) exportStudentPDF(previewStudent); }}>
              <LucideDownload className="w-4 h-4 mr-1" /> Export PDF
            </Button>
            <Button variant="ghost" onClick={printPreview}>
              <LucidePrinter className="w-4 h-4 mr-1" /> Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulletinsPage;
