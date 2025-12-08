// components/SeanceSelector.tsx
import React, { useState } from "react";
import dayjs from "dayjs";

type Seance = { id: string; dateSeance: string; title?: string };

type Props = {
  seances: Seance[];
  value?: string;
  onChange: (id: string) => void;

  // 🔥 nouvelles props pour édition & suppression
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (id: string, payload: { dateSeance?: string; title?: string }) => Promise<void>;
};

export default function SeanceSelector({
  seances,
  value,
  onChange,
  onDelete,
  onUpdate,
}: Props) {
  const [editState, setEditState] = useState<{
    open: boolean;
    id?: string;
    dateSeance?: string;
    title?: string;
  }>({ open: false });

  const openEdit = (s: Seance) => {
    setEditState({
      open: true,
      id: s.id,
      dateSeance: s.dateSeance,
      title: s.title ?? "",
    });
  };

  const closeEdit = () => setEditState({ open: false });

  const confirmEdit = async () => {
    if (!onUpdate || !editState.id) return closeEdit();
    await onUpdate(editState.id, {
      dateSeance: editState.dateSeance,
      title: editState.title,
    });
    closeEdit();
  };

  const confirmDelete = async (id: string) => {
    if (!onDelete) return;
    if (!confirm("Supprimer cette séance ?")) return;
    await onDelete(id);
  };

  return (
    <div className="space-y-2">
      {/* Sélecteur principal */}
      <select
        className="border p-2 rounded w-full"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choisir une séance</option>

        {seances.map((s) => (
          <option key={s.id} value={s.id}>
            {dayjs(s.dateSeance).format("YYYY-MM-DD")}
            {s.title ? ` — ${s.title}` : ""}
          </option>
        ))}
      </select>

      {/* Liste des séances avec actions */}
      <div className="space-y-1">
        {seances.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border p-2 rounded bg-gray-50"
          >
            <div className="text-sm">
              <span className="font-medium">
                {dayjs(s.dateSeance).format("YYYY-MM-DD")}
              </span>
              {s.title ? ` — ${s.title}` : ""}
            </div>

            <div className="flex gap-2">
              {onUpdate && (
                <button
                  className="px-2 py-1 text-xs border rounded"
                  onClick={() => openEdit(s)}
                >
                  Modifier
                </button>
              )}
              {onDelete && (
                <button
                  className="px-2 py-1 text-xs border rounded text-red-600"
                  onClick={() => confirmDelete(s.id)}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ÉDITION */}
      {editState.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow w-[350px] space-y-4">
            <h3 className="text-lg font-semibold">Modifier la séance</h3>

            <div className="space-y-2">
              <label className="block text-sm">Date</label>
              <input
                type="date"
                className="border p-2 rounded w-full"
                value={editState.dateSeance}
                onChange={(e) =>
                  setEditState((st) => ({ ...st, dateSeance: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm">Titre</label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={editState.title}
                onChange={(e) =>
                  setEditState((st) => ({ ...st, title: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="px-3 py-1 border rounded" onClick={closeEdit}>
                Annuler
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={confirmEdit}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
