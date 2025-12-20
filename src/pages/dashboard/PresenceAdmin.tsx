import React, { useEffect, useState } from "react";
import api from "@/services/api"; // ✅ service central pour axios

// Types
interface Module {
  id: string;
  title?: string;
  nom?: string;
  code?: string;
  promotionId?: string | number | null;
}

interface Student {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
}

interface Seance {
  id: string;
  titre: string;
  date: string;
  heureDebut?: string;
  heureFin?: string;
  moduleId: string;
}

interface Presence {
  studentId: string;
  seanceId: string;
  statut: string;
  motif?: string;
}

export default function PresenceAdmin() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const [seances, setSeances] = useState<Seance[]>([]);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [presences, setPresences] = useState<
    Record<string, { statut: string; motif: string }>
  >({});

  const pick = (res: any, keys: string[]) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data) {
      if (Array.isArray(res.data)) return res.data;
      for (const k of keys) if (Array.isArray(res.data[k])) return res.data[k];
    }
    for (const k of keys) if (Array.isArray(res[k])) return res[k];
    return [];
  };

  // Load modules
  const loadModules = async () => {
    try {
      const res = await api.get("/modules");
      setModules(pick(res.data, ["modules", "data"]));
    } catch (e) {
      console.error("Erreur loadModules", e);
    }
  };

  // Load seances
  const loadSeances = async (moduleId: string) => {
    try {
      const res = await api.get(`/presence/seances/by-module/${moduleId}`);
      setSeances(pick(res.data, ["seances", "data"]));
    } catch (e) {
      console.error("Erreur loadSeances", e);
    }
  };

  // Students from promotion
  const loadStudents = async (promotionId?: string | number | null) => {
    if (!promotionId) return;
    try {
      const res = await api.get(`/students/by-promotion/${promotionId}`);
      setStudents(pick(res.data, ["students", "data"]));
    } catch (e) {
      console.error("Erreur loadStudents", e);
    }
  };

  // Load presences
  const loadPresences = async (seanceId: string) => {
    try {
      const res = await api.get(`/presence/by-seance/${seanceId}`);
      const list: Presence[] = pick(res.data, ["presences"]);
      const map: Record<string, { statut: string; motif: string }> = {};
      list.forEach((p) => {
        map[p.studentId] = { statut: p.statut, motif: p.motif ?? "" };
      });
      setPresences(map);
    } catch (e) {
      console.error("Erreur loadPresences", e);
    }
  };

  // Create seance
  const createSeance = async () => {
    if (!selectedModule) return alert("Choisir un module.");
    try {
      const res = await api.post("/presence/seance", {
        moduleId: selectedModule.id,
        titre: "Nouvelle séance",
        date: new Date().toISOString().slice(0, 10),
      });
      const seance = res.data?.seance ?? res.data;
      setSeances((p) => [...p, seance]);
      setSelectedSeance(seance);
      loadPresences(seance.id);
      loadStudents(selectedModule.promotionId);
    } catch (e) {
      console.error("Erreur createSeance", e);
    }
  };

  // Update seance
  const updateSeanceInfo = async () => {
    if (!selectedSeance) return;
    try {
      await api.put(`/presence/seance/${selectedSeance.id}`, selectedSeance);
      alert("Séance mise à jour");
      loadSeances(selectedSeance.moduleId);
    } catch (e) {
      console.error("Erreur updateSeanceInfo", e);
    }
  };

  // Delete seance
  const deleteSeance = async () => {
    if (!selectedSeance) return;
    if (!confirm("Supprimer définitivement cette séance ?")) return;
    try {
      await api.delete(`/presence/seance/${selectedSeance.id}`);
      alert("Séance supprimée.");
      setSelectedSeance(null);
      setPresences({});
      loadSeances(selectedModule!.id);
    } catch (e) {
      console.error("Erreur deleteSeance", e);
    }
  };

  // Save all presences
  const saveAllPresences = async () => {
    if (!selectedSeance) return;
    try {
      const promises = Object.entries(presences).map(
        ([studentId, p]) =>
          api.post("/presence", {
            studentId,
            seanceId: selectedSeance.id,
            statut: p.statut,
            motif: p.motif,
          })
      );
      await Promise.all(promises);
      alert("Présences enregistrées !");
    } catch (e) {
      console.error("Erreur saveAllPresences", e);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const labelModule = (m: Module) => m.title ?? m.nom ?? m.code ?? m.id;
  const labelSeance = (s: Seance) =>
    `${s.titre} — ${s.date} (${s.heureDebut ?? "?"} - ${s.heureFin ?? "?"})`;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📊 Gestion administrative des présences</h2>

      {/* MODULE */}
      <div className="mb-4">
        <label className="font-semibold">Module :</label>
        <select
          className="border p-2 ml-2"
          value={selectedModule?.id ?? ""}
          onChange={(e) => {
            const mod = modules.find((x) => x.id === e.target.value) || null;
            setSelectedModule(mod);
            setSelectedSeance(null);
            setPresences({});
            if (mod) {
              loadSeances(mod.id);
              loadStudents(mod.promotionId);
            }
          }}
        >
          <option value="">-- Choisir --</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {labelModule(m)}
            </option>
          ))}
        </select>
      </div>

      {/* ACTION CREATION SEANCE */}
      {selectedModule && (
        <button
          className="bg-green-600 text-white px-3 py-2 rounded mb-4"
          onClick={createSeance}
        >
          ➕ Créer une séance
        </button>
      )}

      {/* LISTE SEANCES */}
      {seances.length > 0 && (
        <div className="mb-4">
          <label className="font-semibold">Séance :</label>
          <select
            className="border p-2 ml-2"
            value={selectedSeance?.id ?? ""}
            onChange={(e) => {
              const s = seances.find((x) => x.id === e.target.value) || null;
              setSelectedSeance(s || null);
              setPresences({});
              if (s) loadPresences(s.id);
            }}
          >
            <option value="">-- Choisir --</option>
            {seances.map((s) => (
              <option key={s.id} value={s.id}>
                {labelSeance(s)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* FORMULAIRE ÉDITION SEANCE */}
      {selectedSeance && (
        <div className="border p-3 rounded mb-4 bg-gray-50">
          <h3 className="font-semibold mb-2">✏️ Modifier la séance</h3>

          <div className="grid grid-cols-3 gap-3">
            <input
              className="border p-2"
              value={selectedSeance.titre}
              onChange={(e) =>
                setSelectedSeance({ ...selectedSeance, titre: e.target.value })
              }
            />
            <input
              type="date"
              className="border p-2"
              value={selectedSeance.date}
              onChange={(e) =>
                setSelectedSeance({ ...selectedSeance, date: e.target.value })
              }
            />
            <input
              type="time"
              className="border p-2"
              value={selectedSeance.heureDebut ?? ""}
              onChange={(e) =>
                setSelectedSeance({ ...selectedSeance, heureDebut: e.target.value })
              }
            />
            <input
              type="time"
              className="border p-2"
              value={selectedSeance.heureFin ?? ""}
              onChange={(e) =>
                setSelectedSeance({ ...selectedSeance, heureFin: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4 mt-3">
            <button
              className="bg-blue-600 text-white px-3 py-2 rounded"
              onClick={updateSeanceInfo}
            >
              💾 Enregistrer séance
            </button>

            <button
              className="bg-red-600 text-white px-3 py-2 rounded"
              onClick={deleteSeance}
            >
              🗑 Supprimer séance
            </button>
          </div>
        </div>
      )}

      {/* TABLEAU DES PRESENCES */}
      {selectedSeance && (
        <>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">Matricule</th>
                <th className="p-2 border">Nom</th>
                <th className="p-2 border">Statut</th>
                <th className="p-2 border">Motif</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => {
                const p = presences[s.id] ?? { statut: "", motif: "" };
                return (
                  <tr key={s.id}>
                    <td className="p-2 border">{s.matricule}</td>
                    <td className="p-2 border">
                      {s.nom} {s.prenom}
                    </td>

                    <td className="p-2 border">
                      <select
                        className="border p-1"
                        value={p.statut}
                        onChange={(e) =>
                          setPresences((prev) => ({
                            ...prev,
                            [s.id]: { ...p, statut: e.target.value },
                          }))
                        }
                      >
                        <option value="">--</option>
                        <option value="present">Présent</option>
                        <option value="absent">Absent</option>
                        <option value="retard">Retard</option>
                        <option value="justifie">Justifié</option>
                      </select>
                    </td>

                    <td className="p-2 border">
                      <input
                        className="border p-1 w-full"
                        value={p.motif}
                        onChange={(e) =>
                          setPresences((prev) => ({
                            ...prev,
                            [s.id]: { ...p, motif: e.target.value },
                          }))
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            onClick={saveAllPresences}
          >
            💾 Enregistrer toutes les présences
          </button>
        </>
      )}
    </div>
  );
}
