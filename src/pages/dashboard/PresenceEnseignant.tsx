import React, { useEffect, useState } from "react";
import axios from "axios";

// ✅ Sécurisation API (évite erreurs Render)
const API =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://academie-backend-2.onrender.com/api";

// 🔐 token
const auth = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// ---- Interfaces ----
interface Module {
  id: string;
  nom?: string;
  code?: string;
  title?: string;
  promotionId?: string | number | null;
}

interface Student {
  id: string;
  nom?: string;
  prenom?: string;
  matricule?: string;
}

interface Seance {
  id: string;
  date: string;
  titre?: string;
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

// --------------------------------------------------------------------

export default function PresenceEnseignant() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const [seances, setSeances] = useState<Seance[]>([]);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [presences, setPresences] = useState<
    Record<string, { statut: string; motif?: string }>
  >({});

  // ---- MODALE D’ÉDITION ----
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    date: "",
    titre: "",
    heureDebut: "",
    heureFin: "",
  });

  // util: normalise les tableaux
  const pickArray = (res: any, keys: string[]) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;

    if (res.data) {
      if (Array.isArray(res.data)) return res.data;
      for (const k of keys) if (Array.isArray(res.data[k])) return res.data[k];
    }

    for (const k of keys) if (Array.isArray(res[k])) return res[k];
    return [];
  };

  // ---- LOAD MODULES ----
  const loadModules = async () => {
    try {
      const res = await axios.get(`${API}/modules/my`, { headers: auth() });
      const arr = res.data?.modules ?? res.data?.data ?? res.data;
      const final = Array.isArray(arr) ? arr : pickArray(res.data, ["modules"]);
      setModules(final);
    } catch (e) {
      console.error("loadModules error:", e);
    }
  };

  // ---- LOAD SEANCES ----
  const loadSeances = async (moduleId: string) => {
    try {
      const res = await axios.get(
        `${API}/presence/seances/by-module/${moduleId}`,
        { headers: auth() }
      );
      const final = pickArray(res.data, ["seances"]);
      setSeances(final);
    } catch (e) {
      console.error("loadSeances error:", e);
      setSeances([]);
    }
  };

  // ---- LOAD STUDENTS ----
  const loadStudents = async (promotionId: any) => {
    try {
      if (!promotionId) return setStudents([]);

      const res = await axios.get(
        `${API}/students/by-promotion/${promotionId}`,
        { headers: auth() }
      );
      setStudents(pickArray(res.data, ["students"]));
    } catch (e) {
      console.error("loadStudents error:", e);
      setStudents([]);
    }
  };

  // ---- LOAD PRESENCES ----
  const loadPresences = async (seanceId: string) => {
    try {
      const res = await axios.get(`${API}/presence/by-seance/${seanceId}`, {
        headers: auth(),
      });

      const list: Presence[] = pickArray(res.data, ["presences"]);
      const map: Record<string, { statut: string; motif?: string }> = {};

      list.forEach((p) => {
        map[p.studentId] = { statut: p.statut, motif: p.motif ?? "" };
      });

      setPresences(map);
    } catch (e) {
      console.error("loadPresences error:", e);
      setPresences({});
    }
  };

  // ---- CREATE SEANCE ----
  const createSeance = async () => {
    if (!selectedModule) return alert("Choisir un module.");

    const today = new Date().toISOString().slice(0, 10);

    const payload = {
      moduleId: selectedModule.id,
      date: today,
      titre: `Séance du ${today}`,
      heureDebut: "08:00",
      heureFin: "10:00",
    };

    try {
      const res = await axios.post(`${API}/presence/seance`, payload, {
        headers: auth(),
      });

      const s =
        res.data?.seance ??
        res.data?.data ??
        (Array.isArray(res.data) ? res.data[0] : res.data);

      if (s?.id) {
        setSeances((prev) => [...prev, s]);
        setSelectedSeance(s);
        await loadStudents(selectedModule.promotionId);
        await loadPresences(s.id);
      } else {
        await loadSeances(selectedModule.id);
      }
    } catch (e) {
      console.error("createSeance error:", e);
      alert("Erreur création séance.");
    }
  };

  // ---- UPDATE PRESENCE ----
  const updatePresence = async (
    studentId: string,
    statut: string,
    motif = ""
  ) => {
    if (!selectedSeance || !selectedModule) return;

    try {
      const payload = {
        studentId,
        seanceId: selectedSeance.id,
        moduleId: selectedModule.id,
        statut,
        motif,
      };

      await axios.post(`${API}/presence`, payload, { headers: auth() });

      setPresences((prev) => ({
        ...prev,
        [studentId]: { statut, motif },
      }));
    } catch (e) {
      console.error("updatePresence error:", e);
      alert("Enregistrement impossible.");
    }
  };

  // ---- SAVE ALL ----
  const saveAllPresences = async () => {
    if (!selectedSeance || !selectedModule) return;

    try {
      const calls = Object.entries(presences).map(([studentId, p]) =>
        axios.post(
          `${API}/presence`,
          {
            studentId,
            seanceId: selectedSeance.id,
            moduleId: selectedModule.id,
            statut: p.statut,
            motif: p.motif ?? "",
          },
          { headers: auth() }
        )
      );

      await Promise.all(calls);
      alert("Présences enregistrées !");
      await loadPresences(selectedSeance.id);
    } catch (e) {
      console.error("saveAllPresences error:", e);
      alert("Erreur en sauvegarde globale.");
    }
  };

  // ---- MODIFIER SÉANCE ----
  const saveEditedSeance = async () => {
    if (!selectedSeance) return;

    try {
      await axios.put(
        `${API}/presence/seance/${selectedSeance.id}`,
        {
          date: editForm.date,
          titre: editForm.titre,
          heureDebut: editForm.heureDebut,
          heureFin: editForm.heureFin,
        },
        { headers: auth() }
      );

      alert("Séance modifiée !");
      setEditModalOpen(false);

      if (selectedModule) loadSeances(selectedModule.id);
    } catch (e) {
      console.error("Erreur modification séance:", e);
      alert("Erreur modification séance.");
    }
  };

  // ---- DELETE SEANCE ----
  const deleteSeance = async () => {
    if (!selectedSeance) return;
    if (!confirm("Supprimer cette séance ?")) return;

    try {
      await axios.delete(`${API}/presence/seance/${selectedSeance.id}`, {
        headers: auth(),
      });

      alert("Séance supprimée.");
      setSelectedSeance(null);
      setPresences({});
      if (selectedModule) loadSeances(selectedModule.id);
    } catch (e) {
      console.error("deleteSeance error:", e);
      alert("Erreur suppression séance.");
    }
  };

  // INIT
  useEffect(() => {
    loadModules();
  }, []);

  const moduleLabel = (m: Module) =>
    m.nom ?? m.title ?? m.code ?? m.id;

  const seanceLabel = (s: Seance) =>
    `${s.titre ?? "Séance"} - ${s.date} (${
      s.heureDebut ?? "?" } → ${s.heureFin ?? "?" })`;

  // --------------------------------------------------------------------
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gestion des présences</h2>

      {/* MODULE */}
      <div className="mb-4">
        <label className="font-semibold">Module :</label>
        <select
          className="border p-2 ml-2"
          value={selectedModule?.id ?? ""}
          onChange={async (e) => {
            const m = modules.find((x) => x.id === e.target.value) || null;
            setSelectedModule(m);
            setSelectedSeance(null);
            setPresences({});

            if (m) {
              await loadSeances(m.id);
              await loadStudents(m.promotionId);
            }
          }}
        >
          <option value="">-- Choisir --</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {moduleLabel(m)}
            </option>
          ))}
        </select>
      </div>

      {/* ACTIONS */}
      <div className="mb-4 flex gap-3">
        {selectedModule && (
          <button
            onClick={createSeance}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            ➕ Créer une séance
          </button>
        )}

        {selectedSeance && (
          <>
            <button
              onClick={() => {
                if (!selectedSeance) return;
                setEditForm({
                  date: selectedSeance.date,
                  titre: selectedSeance.titre ?? "",
                  heureDebut: selectedSeance.heureDebut ?? "08:00",
                  heureFin: selectedSeance.heureFin ?? "10:00",
                });
                setEditModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-3 py-2 rounded"
            >
              ✏️ Modifier
            </button>

            <button
              onClick={deleteSeance}
              className="bg-red-600 text-white px-3 py-2 rounded"
            >
              🗑 Supprimer
            </button>
          </>
        )}
      </div>

      {/* SEANCES */}
      {seances.length > 0 && (
        <select
          className="border p-2 mb-4"
          value={selectedSeance?.id ?? ""}
          onChange={async (e) => {
            const s = seances.find((x) => x.id === e.target.value) || null;
            setSelectedSeance(s);
            setPresences({});
            if (s) loadPresences(s.id);
          }}
        >
          <option value="">-- Choisir une séance --</option>
          {seances.map((s) => (
            <option key={s.id} value={s.id}>
              {seanceLabel(s)}
            </option>
          ))}
        </select>
      )}

      {/* PRESENCES */}
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
              {students.map((st) => {
                const p = presences[st.id] ?? { statut: "", motif: "" };
                return (
                  <tr key={st.id}>
                    <td className="p-2 border">{st.matricule}</td>
                    <td className="p-2 border">{`${st.nom} ${st.prenom}`}</td>

                    <td className="p-2 border">
                      <select
                        className="border p-1"
                        value={p.statut}
                        onChange={(e) =>
                          updatePresence(st.id, e.target.value, p.motif)
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
                          updatePresence(st.id, p.statut, e.target.value)
                        }
                        placeholder="Motif"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            onClick={saveAllPresences}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            💾 Enregistrer
          </button>
        </>
      )}

      {/* 🔥 MODALE D’ÉDITION DE SÉANCE */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Modifier la séance</h3>

            <label className="block mb-2">Date :</label>
            <input
              type="date"
              className="border p-2 w-full mb-3"
              value={editForm.date}
              onChange={(e) =>
                setEditForm({ ...editForm, date: e.target.value })
              }
            />

            <label className="block mb-2">Titre :</label>
            <input
              type="text"
              className="border p-2 w-full mb-3"
              value={editForm.titre}
              onChange={(e) =>
                setEditForm({ ...editForm, titre: e.target.value })
              }
            />

            <label className="block mb-2">Heure de début :</label>
            <input
              type="time"
              className="border p-2 w-full mb-3"
              value={editForm.heureDebut}
              onChange={(e) =>
                setEditForm({ ...editForm, heureDebut: e.target.value })
              }
            />

            <label className="block mb-2">Heure de fin :</label>
            <input
              type="time"
              className="border p-2 w-full mb-4"
              value={editForm.heureFin}
              onChange={(e) =>
                setEditForm({ ...editForm, heureFin: e.target.value })
              }
            />

            <div className="flex justify-between">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setEditModalOpen(false)}
              >
                Annuler
              </button>

              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={saveEditedSeance}
              >
                💾 Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
