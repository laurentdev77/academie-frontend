// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../utils/axiosConfig";

interface Stats {
  students?: number;
  teachers?: number;
  modules?: number;
  notes?: number;
  bulletins?: number;
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

        // ✅ CORRECTION ICI
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
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold text-sm text-gray-500">Élèves Officiers</h2>
              <p className="text-3xl font-bold">{stats.students ?? 0}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold text-sm text-gray-500">Enseignants</h2>
              <p className="text-3xl font-bold">{stats.teachers ?? 0}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold text-sm text-gray-500">Modules</h2>
              <p className="text-3xl font-bold">{stats.modules ?? 0}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold text-sm text-gray-500">Notes</h2>
              <p className="text-3xl font-bold">{stats.notes ?? 0}</p>
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
