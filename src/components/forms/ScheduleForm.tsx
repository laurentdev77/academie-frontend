// src/components/forms/ScheduleForm.tsx

import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import type { ScheduleType } from "@/types/schedule";
import type { ModuleType } from "@/types/module";
import type { TeacherType } from "@/types/teacher";
import type { PromotionType } from "@/types/promotion";

type Props = {
  schedule: ScheduleType | null;
  modules: ModuleType[];
  teachers: TeacherType[];
  promotions: PromotionType[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

/* -----------------------------------------------------------
    Helpers pour datetime-local
----------------------------------------------------------- */
const toLocalInputValue = (d?: string | Date | null) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromLocalInputValue = (v: string) => {
  if (!v) return null;
  return new Date(v).toISOString();
};

export default function ScheduleForm({
  schedule,
  modules,
  teachers,
  promotions,
  onClose,
  onSaved,
}: Props) {
  // sécurité : si un parent envoie autre chose qu'un tableau
  const _modules = Array.isArray(modules) ? modules : [];
  const _teachers = Array.isArray(teachers) ? teachers : [];
  const _promotions = Array.isArray(promotions) ? promotions : [];

  /* -----------------------------------------------------------
      État local du formulaire
  ----------------------------------------------------------- */
  const [form, setForm] = useState<Partial<ScheduleType>>(() => ({
    id: schedule?.id,
    title: schedule?.title ?? "",
    moduleId: schedule?.moduleId ?? null,
    teacherId: schedule?.teacherId ?? null,
    promotionId: schedule?.promotionId ?? null,
    room: schedule?.room ?? "",
    type: schedule?.type ?? "",
    start: schedule?.start ?? "",
    end: schedule?.end ?? "",
    color: schedule?.color ?? "",
    notes: schedule?.notes ?? "",
  }));

  /* -----------------------------------------------------------
      Mise à jour du formulaire quand schedule change
  ----------------------------------------------------------- */
  useEffect(() => {
    setForm({
      id: schedule?.id,
      title: schedule?.title ?? "",
      moduleId: schedule?.moduleId ?? null,
      teacherId: schedule?.teacherId ?? null,
      promotionId: schedule?.promotionId ?? null,
      room: schedule?.room ?? "",
      type: schedule?.type ?? "",
      start: schedule?.start ?? "",
      end: schedule?.end ?? "",
      color: schedule?.color ?? "",
      notes: schedule?.notes ?? "",
    });
  }, [schedule]);

  /* -----------------------------------------------------------
      Suggestion automatique couleur module
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!form.moduleId) return;
    const m = _modules.find((x) => x.id === form.moduleId);
    if (m?.color && !form.color) {
      setForm((prev) => ({ ...prev, color: m.color! }));
    }
  }, [form.moduleId, _modules]);

  /* -----------------------------------------------------------
      Helpers handleChange
  ----------------------------------------------------------- */
  const handleChange = (key: keyof Partial<ScheduleType>, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* -----------------------------------------------------------
      Submit
  ----------------------------------------------------------- */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      const payload: any = {
        title: (form.title || "").trim(),
        moduleId: form.moduleId || null,
        teacherId: form.teacherId || null,
        promotionId: form.promotionId ?? null,
        room: form.room || null,
        type: form.type || null,
        start: form.start,
        end: form.end,
        color: form.color || null,
        notes: form.notes || null,
      };

      // Normalisation datetime-local
      if ((form as any)._startLocal)
        payload.start = fromLocalInputValue((form as any)._startLocal);
      if ((form as any)._endLocal)
        payload.end = fromLocalInputValue((form as any)._endLocal);

      if (form.id) {
        await api.put(`/schedules/${form.id}`, payload);
      } else {
        await api.post("/schedules", payload);
      }

      await onSaved();
    } catch (err: any) {
      console.error("Erreur sauvegarde:", err.response?.data || err.message);
      alert("Erreur sauvegarde");
    }
  };

  /* -----------------------------------------------------------
      Suppression
  ----------------------------------------------------------- */
  const handleDelete = async () => {
    if (!form.id) return alert("Aucun ID !");
    if (!confirm("Confirmer la suppression ?")) return;

    try {
      await api.delete(`/schedules/${form.id}`);
      await onSaved();
    } catch (err: any) {
      console.error("Erreur suppression:", err.response?.data || err.message);
      alert("Erreur suppression");
    }
  };

  /* -----------------------------------------------------------
      Conversion datetime-local SAFE (patch TS)
  ----------------------------------------------------------- */
  const startLocal = useMemo(
    () => toLocalInputValue(form.start ?? null),
    [form.start]
  );

  const endLocal = useMemo(
    () => toLocalInputValue(form.end ?? null),
    [form.end]
  );

  /* -----------------------------------------------------------
      UI
  ----------------------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        className="relative z-50 w-full max-w-2xl bg-white rounded shadow p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {form.id ? "Modifier le cours" : "Créer un cours"}
          </h2>

          <div className="flex gap-2">
            {form.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Supprimer
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* ---------------------------------------------- */}
        {/* FORMULAIRE */}
        {/* ---------------------------------------------- */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Titre</label>
            <input
              className="w-full border p-2 rounded"
              value={form.title ?? ""}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Module</label>
            <select
              className="w-full border p-2 rounded"
              value={form.moduleId ?? ""}
              onChange={(e) => handleChange("moduleId", e.target.value || null)}
            >
              <option value="">— Aucun —</option>
              {_modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Enseignant</label>
            <select
              className="w-full border p-2 rounded"
              value={form.teacherId ?? ""}
              onChange={(e) => handleChange("teacherId", e.target.value || null)}
            >
              <option value="">— Aucun —</option>
              {_teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Promotion</label>
            <select
              className="w-full border p-2 rounded"
              value={form.promotionId ?? ""}
              onChange={(e) =>
                handleChange(
                  "promotionId",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              <option value="">— Aucune —</option>
              {_promotions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Début</label>
            <input
              type="datetime-local"
              className="w-full border p-2 rounded"
              value={startLocal}
              onChange={(e) => {
                handleChange("_startLocal" as any, e.target.value);
                handleChange("start", fromLocalInputValue(e.target.value));
              }}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Fin</label>
            <input
              type="datetime-local"
              className="w-full border p-2 rounded"
              value={endLocal}
              onChange={(e) => {
                handleChange("_endLocal" as any, e.target.value);
                handleChange("end", fromLocalInputValue(e.target.value));
              }}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Salle</label>
            <input
              className="w-full border p-2 rounded"
              value={form.room ?? ""}
              onChange={(e) => handleChange("room", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <input
              className="w-full border p-2 rounded"
              value={form.type ?? ""}
              onChange={(e) => handleChange("type", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Couleur</label>
            <input
              type="color"
              className="w-full border p-1 rounded"
              value={form.color ?? "#0066ff"}
              onChange={(e) => handleChange("color", e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full border p-2 rounded"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
        </div>

        {/* ---------------------------------------------- */}
        {/* ACTIONS */}
        {/* ---------------------------------------------- */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (form.moduleId) {
                const m = _modules.find((x) => x.id === form.moduleId);
                if (m?.color) handleChange("color", m.color);
              }
            }}
            className="px-3 py-1 bg-indigo-100 rounded"
          >
            Utiliser couleur module
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
