import React, { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function PresenceTakingPage({ moduleId }) {
  const [students, setStudents] = useState([]);
  const [statusByStudent, setStatusByStudent] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger étudiants de la promotion
    axios.get(`/api/students/by-promotion/${moduleId}`)
      .then(res => setStudents(res.data))
      .catch(console.error);
  }, [moduleId]);

  const mark = async (studentId, statut) => {
    setStatusByStudent(prev => ({ ...prev, [studentId]: statut }));
  };

  const saveAll = async () => {
    setLoading(true);

    for (const student of students) {
      const statut = statusByStudent[student.id] || "absent";

      await axios.post("/api/presence/mark", {
        studentId: student.id,
        moduleId,
        statut,
        dateSeance: new Date().toISOString().slice(0, 10)
      });
    }

    setLoading(false);
    alert("Présences enregistrées !");
  };

  return (
    <div>
      <h2>Prise de présence</h2>
      
      <table>
        <thead>
          <tr>
            <th>Élève</th>
            <th>Présent</th>
            <th>Absent</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id}>
              <td>{s.nom} {s.prenom}</td>

              <td>
                <button
                  onClick={() => mark(s.id, "present")}
                  style={{ background: statusByStudent[s.id] === "present" ? "green" : "" }}
                >
                  ✓
                </button>
              </td>

              <td>
                <button
                  onClick={() => mark(s.id, "absent")}
                  style={{ background: statusByStudent[s.id] === "absent" ? "red" : "" }}
                >
                  ✗
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={saveAll} disabled={loading}>Enregistrer</button>
    </div>
  );
}
