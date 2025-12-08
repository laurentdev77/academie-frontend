import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import type { StudentPresence } from "@/pages/dashboard/PresenceEnseignant";
import api from "@/lib/axiosConfig";

interface Props {
  students: StudentPresence[];
  loading: boolean;
  selectedModule: string;
  selectedSeance: string;
  onSaveAll: () => void;
  onSingleSaved: () => void;
}

export default function PresenceTable({ students, loading, selectedModule, selectedSeance, onSaveAll, onSingleSaved }: Props) {
  const [localPresences, setLocalPresences] = useState<Record<string, string>>({});
  const [savingPerStudent, setSavingPerStudent] = useState<Record<string, boolean>>({});
  const [savingAll, setSavingAll] = useState(false);
  const safeStudents = students ?? [];

  // init local map when students change
  React.useEffect(() => {
    const start: Record<string, string> = {};
    safeStudents.forEach((s) => {
      const id = String(s.id);
      start[id] = s.presence?.statut ?? "";
    });
    setLocalPresences(start);
    setSavingPerStudent({});
  }, [students]);

  const handleLocalPresenceChange = (studentId: string, statut: string) => {
    setLocalPresences((p) => ({ ...p, [studentId]: statut }));
  };

  const saveSinglePresence = async (studentId: string) => {
    if (!selectedSeance) return;
    const statut = localPresences[studentId] ?? "";
    setSavingPerStudent((p) => ({ ...p, [studentId]: true }));
    try {
      await api.post("/presences/mark", {
        seanceId: selectedSeance,
        studentId,
        statut: statut || null,
        motif: null,
      });
      await onSingleSaved();
    } catch (err: any) {
      console.error("Erreur enregistrement présence:", err);
      alert(err?.response?.data?.message || err?.message || "Erreur enregistrement");
    } finally {
      setSavingPerStudent((p) => ({ ...p, [studentId]: false }));
    }
  };

  const saveAllPresences = async () => {
    if (!selectedSeance) return;
    setSavingAll(true);
    try {
      const payload = Object.entries(localPresences).map(([studentId, statut]) => ({
        seanceId: selectedSeance,
        studentId,
        statut: statut || null,
        motif: null,
      }));
      // try bulk endpoint first
      await api.post("/presences/bulk", { presences: payload });
      await onSaveAll();
    } catch (err: any) {
      console.warn("Bulk failed, trying single requests...", err);
      try {
        for (const [studentId, statut] of Object.entries(localPresences)) {
          setSavingPerStudent((p) => ({ ...p, [studentId]: true }));
          await api.post("/presences/mark", { seanceId: selectedSeance, studentId, statut: statut || null, motif: null });
          setSavingPerStudent((p) => ({ ...p, [studentId]: false }));
        }
        await onSaveAll();
      } catch (err2: any) {
        console.error("Erreur fallback save:", err2);
        alert(err2?.response?.data?.message || err2?.message || "Erreur enregistrement présences");
      }
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button variant="secondary" size="sm" onClick={saveAllPresences} disabled={savingAll || loading || Object.keys(localPresences).length === 0}>
          <span className="inline-flex items-center">
            {savingAll ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Enregistrer toutes les présences
          </span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" />
          <span>Chargement des étudiants...</span>
        </div>
      ) : safeStudents.length === 0 ? (
        <div>
          <p>Aucun étudiant trouvé pour la promotion de ce module.</p>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-2 text-left">Matricule</th>
                <th className="p-2 text-left">Nom</th>
                <th className="p-2 text-left">Prénom</th>
                <th className="p-2 text-left">Statut</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeStudents.map((st) => {
                const sid = String(st.id);
                const current = localPresences[sid] ?? "";
                const isSaving = !!savingPerStudent[sid];
                return (
                  <tr key={sid} className="border-b">
                    <td className="p-2">{st.matricule ?? "-"}</td>
                    <td className="p-2">{st.nom ?? "-"}</td>
                    <td className="p-2">{st.prenom ?? "-"}</td>
                    <td className="p-2">
                      <select
                        value={current}
                        onChange={(e) => handleLocalPresenceChange(sid, e.target.value)}
                        className="rounded border px-2 py-1"
                        aria-label={`Statut ${st.nom ?? sid}`}
                      >
                        <option value="">— Non renseigné —</option>
                        <option value="present">Présent</option>
                        <option value="absent">Absent</option>
                        <option value="retard">Retard</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <Button size="sm" onClick={() => saveSinglePresence(sid)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}Enregistrer
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
