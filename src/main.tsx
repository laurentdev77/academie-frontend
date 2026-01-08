import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Pages publiques
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Layout & Dashboard pages
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard/Home";

import CalendrierAcademique from "./pages/dashboard/CalendrierAcademique";
import CalendrierEnseignant from "./pages/dashboard/CalendrierEnseignant";
import CalendrierEtudiant from "./pages/dashboard/CalendrierEtudiant";

import Utilisateurs from "./pages/dashboard/Utilisateurs";
import Etudiants from "./pages/dashboard/Etudiants";
import Enseignants from "./pages/dashboard/Enseignants";
import EtudiantsEnseignant from "./pages/dashboard/EtudiantsEnseignant";

import Modules from "./pages/dashboard/Modules";
import ModulesEnseignant from "./pages/dashboard/ModulesEnseignant";
import ModulesEtudiant from "./pages/dashboard/ModulesEtudiant";

import Notes from "./pages/dashboard/Notes";
import NotesEnseignant from "./pages/dashboard/NotesEnseignant";
import NotesEtudiant from "./pages/dashboard/NotesEtudiant";

import Bulletins from "./pages/dashboard/Bulletins";
import MonBulletin from "./pages/dashboard/MonBulletin";

import Filieres from "./pages/dashboard/Filieres";
import PromotionsPage from "./pages/dashboard/Promotions";

// 📌 Import Présences
import PresenceEnseignant from "./pages/dashboard/PresenceEnseignant";
import PresenceAdmin from "./pages/dashboard/PresenceAdmin";
import PresenceEtudiant from "./pages/dashboard/PresenceEtudiant";

import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* 🌍 Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🧭 Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>

            <Route index element={<DashboardHome />} />

            {/* 🎓 Calendrier */}
            <Route path="CalendrierAcademique" element={<CalendrierAcademique />} />
            <Route path="CalendrierEnseignant" element={<CalendrierEnseignant />} />
            <Route path="CalendrierEtudiant" element={<CalendrierEtudiant />} />

            {/* 👥 Éloèves & Enseignants */}
            <Route path="etudiants" element={<Etudiants />} />
            <Route path="Enseignants" element={<Enseignants />} />
            <Route path="EtudiantsEnseignant" element={<EtudiantsEnseignant />} />

            {/* 👤 Utilisateurs */}
            <Route path="utilisateurs" element={<Utilisateurs />} />

            {/* 📘 Modules */}
            <Route path="modules" element={<Modules />} />
            <Route path="ModulesEnseignant" element={<ModulesEnseignant />} />
            <Route path="ModulesEtudiant" element={<ModulesEtudiant />} />

            {/* 📝 Notes */}
            <Route path="notes" element={<Notes />} />
            <Route path="NotesEnseignant" element={<NotesEnseignant />} />
            <Route path="NotesEtudiant" element={<NotesEtudiant />} />

            {/* 📄 Bulletins */}
            <Route path="bulletins" element={<Bulletins />} />
            <Route path="MonBulletin" element={<MonBulletin />} />

            {/* Filières + Promotions */}
            <Route path="filieres" element={<Filieres />} />
            <Route path="promotions" element={<PromotionsPage />} />

            {/* 📌 Présences */}
            <Route path="presences" element={<PresenceEnseignant />} />
            <Route path="PresenceAdmin" element={<PresenceAdmin />} />
            <Route path="PresencesEtudiant" element={<PresenceEtudiant />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
