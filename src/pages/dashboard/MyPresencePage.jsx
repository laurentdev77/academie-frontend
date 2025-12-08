import React, { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function MyPresencePage() {
  const [presences, setPresences] = useState([]);

  useEffect(() => {
    axios.get("/api/presence/my")
      .then(res => setPresences(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2>Mes présences</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Module</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {presences.map(p => (
            <tr key={p.id}>
              <td>{p.dateSeance}</td>
              <td>{p.module?.title}</td>
              <td style={{ color: p.statut === "present" ? "green" : "red" }}>
                {p.statut === "present" ? "Présent" : "Absent"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
