// components/HistoryModal.tsx
import React from "react";

type RecordItem = { id?: string; dateSeance?: string; moduleId?: string; statut?: string; motif?: string | null };
type Props = { open: boolean; studentName?: string; records?: RecordItem[]; onClose: () => void; };

export default function HistoryModal({ open, studentName, records, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded shadow p-4 z-10 w-full max-w-3xl max-h-[70vh] overflow-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Historique — {studentName}</h3>
          <button className="px-2 py-1 border rounded" onClick={onClose}>Fermer</button>
        </div>
        {(!records || records.length === 0) ? <div>Aucun historique.</div> : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100"><tr><th className="p-2">Date</th><th className="p-2">Module</th><th className="p-2">Statut</th><th className="p-2">Motif</th></tr></thead>
            <tbody>
              {records.map((r) => (<tr key={String(r.id ?? `${r.dateSeance}-${r.moduleId}`)} className="border-t"><td className="p-2">{r.dateSeance}</td><td className="p-2">{r.moduleId}</td><td className="p-2">{r.statut}</td><td className="p-2">{r.motif ?? "-"}</td></tr>))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
