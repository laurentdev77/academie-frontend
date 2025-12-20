import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "https://academie-backend-2.onrender.com/api";

interface Presence {
  id: number;
  date: string;
  module: string;
  status: "present" | "absent";
  motif?: string;
}

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
      .get(`${API}/presence/student/my`, {
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
                <td className="p-2">{p.date}</td>
                <td className="p-2">{p.module}</td>
                <td className={`p-2 font-semibold ${p.status === "present" ? "text-green-600" : "text-red-600"}`}>
                  {p.status === "present" ? "Présent" : "Absent"}
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
