import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logoacademie.png";
import { Button } from "@/components/ui/button";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-6">
      {/* Logo avec animation */}
      <img
        src={Logo}
        alt="Académie Militaire"
        className="w-32 sm:w-40 mb-6 transition-transform duration-500 hover:scale-105 hover:rotate-3"
      />

      {/* Texte officiel */}
      <div className="text-center mb-10 space-y-1 sm:space-y-2">
        <h1 className="text-lg sm:text-xl font-bold">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h1>
        <p className="text-base sm:text-lg font-semibold">FORCES ARMÉES</p>
        <p className="text-base sm:text-lg font-semibold">ÉTAT-MAJOR GÉNÉRAL</p>
        <p className="text-base sm:text-lg font-semibold">COMMANDEMENT GÉNÉRAL DES ÉCOLES MILITAIRES</p>
        <p className="text-lg sm:text-xl font-bold mt-2">ACADÉMIE MILITAIRE DE KANANGA</p>
      </div>

      {/* Boutons Login / Register avec animation */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="default"
          className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-2 sm:px-10 sm:py-3 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
          onClick={() => navigate("/login")}
        >
          Se connecter
        </Button>

        <Button
          variant="default"
          className="bg-green-700 hover:bg-green-800 text-white px-8 py-2 sm:px-10 sm:py-3 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
          onClick={() => navigate("/register")}
        >
          S'inscrire
        </Button>
      </div>
    </div>
  );
};

export default Home;
