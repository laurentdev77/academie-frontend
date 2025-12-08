import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface Presence {
  id: number;
  date: string;
  module: string;
  status: "present" | "absent";
  motif?: string;
}

const PresenceEtudiant: React.FC = () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [list, setList] = useState<Presence[]>([]);

  useEffect(() => {
    axios.get(`${API}/presence/student/my`, { headers }).then((res) => {
      setList(res.data);
    });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">📗 Mes présences</h2>

      <table className="w-full mt-4 border">
        <thead className="bg-gray-100">
          <tr>
            <th>Date</th>
            <th>Cours</th>
            <th>Statut</th>
            <th>Motif</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border">
              <td>{p.date}</td>
              <td>{p.module}</td>
              <td className={p.status === "present" ? "text-green-600" : "text-red-600"}>
                {p.status === "present" ? "Présent" : "Absent"}
              </td>
              <td>{p.motif || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PresenceEtudiant;
