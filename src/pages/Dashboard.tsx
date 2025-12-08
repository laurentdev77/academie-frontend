// src/pages/Dashboard.tsx
import React from "react";
import Navbar from "../components/Navbar";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-4">Bienvenue au Dashboard</h1>
        <p className="text-gray-700">
          Ceci est votre page d’accueil après connexion.
        </p>

        {/* Exemple de cartes ou widgets */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold text-xl">Statistiques</h2>
            <p>Quelques chiffres clés ici...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold text-xl">Notifications</h2>
            <p>Dernières alertes et messages...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold text-xl">Tâches</h2>
            <p>Vos tâches récentes...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;