import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "https://academie-backend-2.onrender.com/api";

interface Presence {
  id: number;
  date: string;
  module: string | { title: string }; // module peut être string ou objet
  status: "present" | "absent";
  motif?: string;
}

// Helper pour formater les dates
const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Badge visuel pour le statut
const StatusBadge: React.FC<{ status: "present" | "absent" }> = ({ status }) => {
  const colors = {
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
      {status === "present" ? "Présent" : "Absent"}
    </span>
  );
};

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
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
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
                <td className="p-2">{formatDate(p.date)}</td>
                <td className="p-2">{typeof p.module === "string" ? p.module : p.module.title}</td>
                <td className="p-2">
                  <StatusBadge status={p.status} />
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
