// components/MotifModal.tsx
import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog"; // if shadcn available; otherwise fallback simple modal

type Props = {
  open: boolean;
  initial?: string | null;
  onCancel: () => void;
  onConfirm: (motif: string | null) => void;
};

export default function MotifModal({ open, initial, onCancel, onConfirm }: Props) {
  const [value, setValue] = useState(initial ?? "");

  React.useEffect(() => setValue(initial ?? ""), [initial, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="bg-white rounded shadow p-4 z-10 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Motif (optionnel)</h3>
        <textarea value={value} onChange={(e)=> setValue(e.target.value)} rows={5} className="w-full border p-2 rounded" />
        <div className="flex justify-end gap-2 mt-3">
          <button className="px-3 py-1 border rounded" onClick={onCancel}>Annuler</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => onConfirm(value.trim() === "" ? null : value.trim())}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}
