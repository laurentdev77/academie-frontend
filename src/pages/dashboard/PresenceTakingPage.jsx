import React, { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function PresenceTakingPage({ moduleId }) {
  const [students, setStudents] = useState([]);
  const [statusByStudent, setStatusByStudent] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!moduleId) return;

    setError(null);
    axios
      .get(`/api/students/by-promotion/${moduleId}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setStudents(data);
      })
      .catch((err) => {
        console.error("Erreur chargement étudiants:", err);
        setError("Impossible de charger les étudiants.");
      });
  }, [moduleId]);

  const mark = (studentId, statut) => {
    setStatusByStudent((prev) => ({ ...prev, [studentId]: statut }));
  };

  const saveAll = async () => {
    if (!moduleId) return;

    setLoading(true);
    setError(null);

    try {
      const calls = students.map((student) => {
        const statut = statusByStudent[student.id] || "absent";
        return axios.post("/api/presence/mark", {
          studentId: student.id,
          moduleId,
          statut,
          dateSeance: new Date().toISOString().slice(0, 10),
        });
      });

      await Promise.all(calls);
      alert("Présences enregistrées !");
    } catch (err) {
      console.error("Erreur enregistrement présences:", err);
      setError("Impossible d’enregistrer les présences.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📋 Prise de présence</h2>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Élève</th>
            <th className="p-2 border">Présent</th>
            <th className="p-2 border">Absent</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center p-4">
                Aucun étudiant disponible
              </td>
            </tr>
          )}
          {students.map((s) => {
            const p = statusByStudent[s.id] || "";
            return (
              <tr key={s.id} className="border-t">
                <td className="p-2 border">{s.nom} {s.prenom}</td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => mark(s.id, "present")}
                    className={`px-2 py-1 rounded font-bold ${p === "present" ? "bg-green-500 text-white" : "bg-gray-200"}`}
                  >
                    ✓
                  </button>
                </td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => mark(s.id, "absent")}
                    className={`px-2 py-1 rounded font-bold ${p === "absent" ? "bg-red-500 text-white" : "bg-gray-200"}`}
                  >
                    ✗
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={saveAll}
        disabled={loading || students.length === 0}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "💾 Enregistrer"}
      </button>
    </div>
  );
}
