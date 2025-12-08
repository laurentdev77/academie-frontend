// src/components/Navbar.tsx
import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-slate-800 text-white p-4 flex justify-between">
      <div className="font-bold text-lg">Académie Militaire</div>
      <div className="space-x-4">
        <Link to="/dashboard" className="hover:underline">
          Accueil
        </Link>
        <Link to="/login" className="hover:underline">
          Logout
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
