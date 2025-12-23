// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../utils/axiosConfig";

interface Stats {
  students: number;
  teachers: number;
  modules: number;
  notes: number;
  bulletins: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: { id: number; name: string } | null;
  status: string;
  lastLoginAt: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/dashboard/stats"),
        ]);

        setUser(profileRes.data.user);
        // ✅ Récupérer uniquement le sous-objet stats
        setStats(statsRes.data.stats);
      } catch (err: any) {
        console.error("fetch error:", err);
        setError("Impossible de charger le profil ou les statistiques.");
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="p-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <h1 className="text-3xl font-bold mb-4">
          Bienvenue {user?.username || "au Dashboard"}
        </h1>

        {stats ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold text-xl mb-2">Statistiques</h2>
              <p>Étudiants: {stats.students}</p>
              <p>Enseignants: {stats.teachers}</p>
              <p>Modules: {stats.modules}</p>
              <p>Notes: {stats.notes}</p>
              <p>Bulletins: {stats.bulletins}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold text-xl mb-2">Notifications</h2>
              <p>Dernières alertes et messages...</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold text-xl mb-2">Tâches</h2>
              <p>Vos tâches récentes...</p>
            </div>
          </div>
        ) : (
          <p>Chargement des statistiques...</p>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
