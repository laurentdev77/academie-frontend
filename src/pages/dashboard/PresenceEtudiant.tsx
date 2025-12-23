import React, { useEffect, useState } from "react";
import axios from "axios";

const API =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://academie-backend-2.onrender.com/api";

/* ======================= TYPES ======================= */
type PresenceStatus = "present" | "absent" | "late" | "justified";

interface Presence {
  id: number;
  date?: string | null;
  createdAt?: string | null;
  module: string | { title: string };
  status?: string;
  isPresent?: boolean;
  isLate?: boolean;
  isJustified?: boolean;
  motif?: string;
}

/* ======================= HELPERS ======================= */
// Format date sécurisé
const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Mapping backend → frontend
const mapStatus = (p: Presence): PresenceStatus => {
  if (p.status) {
    switch (p.status.toLowerCase()) {
      case "present":
        return "present";
      case "absent":
        return "absent";
      case "retard":
      case "late":
        return "late";
      case "justifie":
      case "justified":
        return "justified";
    }
  }

  if (p.isJustified) return "justified";
  if (p.isLate) return "late";
  if (p.isPresent) return "present";

  return "absent";
};

/* ======================= STATUS BADGE ======================= */
const StatusBadge: React.FC<{ status: PresenceStatus }> = ({ status }) => {
  const config: Record<
    PresenceStatus,
    { label: string; className: string }
  > = {
    present: {
      label: "Présent",
      className: "bg-green-100 text-green-800",
    },
    absent: {
      label: "Absent",
      className: "bg-red-100 text-red-800",
    },
    late: {
      label: "Retard",
      className: "bg-yellow-100 text-yellow-800",
    },
    justified: {
      label: "Justifié",
      className: "bg-blue-100 text-blue-800",
    },
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${config[status].className}`}
    >
      {config[status].label}
    </span>
  );
};

/* ======================= COMPONENT ======================= */
const PresenceEtudiant: React.FC = () => {
  const [list, setList] = useState<Presence[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token manquant — veuillez vous reconnecter.");
      return;
    }

    axios
      .get(`${API}/presence/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? [];
        setList(data);
      })
      .catch((err) => {
        console.error("Erreur fetch présences:", err);
        setError("Impossible de récupérer les présences.");
      });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">📗 Mes présences</h2>

      {error && <div className="text-red-600 my-3">{error}</div>}

      <table className="w-full mt-4 border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Cours</th>
            <th className="p-2 border">Statut</th>
            <th className="p-2 border">Motif</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-4">
                Aucune présence disponible
              </td>
            </tr>
          ) : (
            list.map((p) => (
              <tr key={p.id} className="border">
                <td className="p-2">
                  {formatDate(p.date ?? p.createdAt)}
                </td>
                <td className="p-2">
                  {typeof p.module === "string"
                    ? p.module
                    : p.module?.title ?? "—"}
                </td>
                <td className="p-2">
                  <StatusBadge status={mapStatus(p)} />
                </td>
                <td className="p-2">{p.motif || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PresenceEtudiant;
