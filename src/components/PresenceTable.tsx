// components/PresenceTable.tsx
import React, { useState } from "react";
import MotifModal from "./MotifModal";

type Student = {
  id: string | number;
  matricule?: string;
  nom?: string;
  prenom?: string;
};

type PresenceStatus = "present" | "absent" | "retard";

type Presence = {
  id?: string;
  studentId: string | number;
  student?: Student;
  statut: PresenceStatus;
  motif?: string | null;
  dateSeance?: string;
  seanceId?: string;
};

type Props = {
  list: Presence[];
  onSetLocal: (
    studentId: string | number,
    statut: PresenceStatus,
    motif?: string | null,
    save?: boolean
  ) => void;
  onSaveOne: (p: Presence) => Promise<void>;
  onDelete: (presenceId?: string, studentId?: string | number) => Promise<void>;
  onOpenHistory: (student?: Student) => void;
  autoSave: boolean;
};

export default function PresenceTable({
  list,
  onSetLocal,
  onSaveOne,
  onDelete,
  onOpenHistory,
  autoSave,
}: Props) {
  const [motifState, setMotifState] = useState<{
    open: boolean;
    studentId?: string | number;
    statut?: PresenceStatus;
    initial?: string | null;
  }>({ open: false });

  /** Ouvre le modal motif uniquement pour absent/retard */
  const openMotif = (
    studentId: string | number,
    statut: Exclude<PresenceStatus, "present">,
    initial?: string | null
  ) => {
    setMotifState({
      open: true,
      studentId,
      statut,
      initial: initial ?? null,
    });
  };

  const closeMotif = () => setMotifState({ open: false });

  const confirmMotif = async (value?: string | null) => {
    if (!motifState.studentId || !motifState.statut) {
      closeMotif();
      return;
    }

    await onSetLocal(
      motifState.studentId,
      motifState.statut,
      value ?? null,
      true
    );

    closeMotif();
  };

  return (
    <>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">Matricule</th>
            <th className="p-2">Nom</th>
            <th className="p-2">Statut</th>
            <th className="p-2">Motif</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {list.map((p, idx) => (
            <tr key={String(p.studentId)} className="border-t">
              <td className="p-2 align-middle">{idx + 1}</td>

              {/* Matricule */}
              <td className="p-2">{p.student?.matricule ?? "-"}</td>

              {/* Nom */}
              <td
                className="p-2 cursor-pointer hover:underline"
                onClick={() => onOpenHistory(p.student)}
              >
                {p.student?.nom} {p.student?.prenom}
              </td>

              {/* STATUT */}
              <td className="p-2">
                <div className="flex gap-2">
                  {/* PRESENT */}
                  <button
                    className={`px-2 py-1 rounded ${
                      p.statut === "present"
                        ? "bg-green-600 text-white"
                        : "border"
                    }`}
                    onClick={() =>
                      onSetLocal(
                        p.studentId,
                        "present",
                        p.motif ?? null,
                        autoSave
                      )
                    }
                  >
                    Présent
                  </button>

                  {/* ABSENT */}
                  <button
                    className={`px-2 py-1 rounded ${
                      p.statut === "absent"
                        ? "bg-red-600 text-white"
                        : "border"
                    }`}
                    onClick={() =>
                      openMotif(p.studentId, "absent", p.motif ?? null)
                    }
                  >
                    Absent
                  </button>

                  {/* RETARD */}
                  <button
                    className={`px-2 py-1 rounded ${
                      p.statut === "retard"
                        ? "bg-yellow-500 text-white"
                        : "border"
                    }`}
                    onClick={() =>
                      openMotif(p.studentId, "retard", p.motif ?? null)
                    }
                  >
                    Retard
                  </button>
                </div>
              </td>

              {/* MOTIF */}
              <td className="p-2">
                <input
                  className="border rounded w-full p-1"
                  value={p.motif ?? ""}
                  onChange={(e) =>
                    onSetLocal(
                      p.studentId,
                      p.statut,
                      e.target.value || null,
                      autoSave
                    )
                  }
                />
              </td>

              {/* ACTIONS */}
              <td className="p-2">
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={() => onSaveOne(p)}
                  >
                    Sauvegarder
                  </button>

                  <button
                    className="px-2 py-1 border rounded text-red-600"
                    onClick={() => onDelete(p.id, p.studentId)}
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL MOTIF */}
      <MotifModal
        open={motifState.open}
        initial={motifState.initial ?? null}
        onCancel={closeMotif}
        onConfirm={confirmMotif}
      />
    </>
  );
}
