// src/layouts/DashboardLayout.tsx
import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "@/utils/axiosConfig";
import { Button } from "@/components/ui/button";
import {
  LucideHome,
  LucideUser,
  LucideBook,
  LucideClipboard,
  LucideCalendarDays,
  Users as LucideUsers,
  LucideLogOut,
  LucideMenu,
  LucideCheckSquare,
  LucideRefreshCw,
} from "lucide-react";

interface User {
  id?: string;
  username?: string;
  role?: { name?: string };
  avatarUrl?: string | null;
  email?: string | null;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  /** ✅ Affichage immédiat depuis le cache (connexion rapide) */
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const navItems: NavItem[] = [
    { name: "Accueil", path: "/dashboard", icon: <LucideHome className="w-5 h-5" />, roles: ["student", "teacher", "secretary", "admin", "DE"] },
    { name: "Calendrier Académique", path: "/dashboard/CalendrierAcademique", icon: <LucideCalendarDays className="w-5 h-5" />, roles: ["secretary", "admin", "DE"] },
    { name: "Mon Calendrier Académique", path: "/dashboard/CalendrierEnseignant", icon: <LucideCalendarDays className="w-5 h-5" />, roles: ["teacher"] },
    { name: "Mon Calendrier Académique", path: "/dashboard/CalendrierEtudiant", icon: <LucideCalendarDays className="w-5 h-5" />, roles: ["student"] },
    { name: "Elèves Officiers", path: "/dashboard/etudiants", icon: <LucideUser className="w-5 h-5" />, roles: ["secretary", "admin", "DE"] },
    { name: "Elèves Officiers", path: "/dashboard/EtudiantsEnseignant", icon: <LucideUser className="w-5 h-5" />, roles: ["teacher"] },
    { name: "Enseignants", path: "/dashboard/Enseignants", icon: <LucideUser className="w-5 h-5" />, roles: ["secretary", "admin", "DE"] },
    { name: "Utilisateurs", path: "/dashboard/utilisateurs", icon: <LucideUsers className="w-5 h-5" />, roles: ["admin", "DE", "secretary"] },
    { name: "Filières", path: "/dashboard/filieres", icon: <LucideBook className="w-5 h-5" />, roles: ["admin", "DE"] },
    { name: "Promotions", path: "/dashboard/promotions", icon: <LucideBook className="w-5 h-5" />, roles: ["admin", "DE"] },
    { name: "Modules (Cours)", path: "/dashboard/modules", icon: <LucideBook className="w-5 h-5" />, roles: ["admin", "secretary", "DE"] },
    { name: "Modules (Cours)", path: "/dashboard/ModulesEtudiant", icon: <LucideBook className="w-5 h-5" />, roles: ["student"] },
    { name: "Mes Modules (Cours)", path: "/dashboard/ModulesEnseignant", icon: <LucideBook className="w-5 h-5" />, roles: ["teacher"] },
    { name: "Notes des EO", path: "/dashboard/notes", icon: <LucideClipboard className="w-5 h-5" />, roles: ["admin", "teacher", "secretary", "DE"] },
    { name: "Mes Notes", path: "/dashboard/NotesEtudiant", icon: <LucideClipboard className="w-5 h-5" />, roles: ["student"] },
    { name: "Bulletins", path: "/dashboard/bulletins", icon: <LucideClipboard className="w-5 h-5" />, roles: ["admin", "secretary", "DE"] },
    { name: "Mon Bulletin", path: "/dashboard/MonBulletin", icon: <LucideClipboard className="w-5 h-5" />, roles: ["student"] },
    { name: "Présences", path: "/dashboard/presences", icon: <LucideCheckSquare className="w-5 h-5" />, roles: ["teacher"] },
    { name: "Présences", path: "/dashboard/presenceAdmin", icon: <LucideCheckSquare className="w-5 h-5" />, roles: ["secretary", "admin", "DE"] },
    { name: "Mes Présences", path: "/dashboard/PresencesEtudiant", icon: <LucideCheckSquare className="w-5 h-5" />, roles: ["student"] },
  ];

  const token = localStorage.getItem("token");

  /** ✅ Fetch profil en arrière-plan */
  const fetchProfile = async () => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoadingProfile(true);
    setAuthError(null);

    try {
      const res = await api.get("/auth/profile");
      const u = res.data?.user;

      const normalized: User = {
        id: u.id,
        username: u.username ?? u.name ?? "Utilisateur",
        role: u.role ? { name: u.role.name } : undefined,
        avatarUrl: u.photoUrl ? `${import.meta.env.VITE_API_URL}${u.photoUrl}`: u.avatarUrl ?? null,
        email: u.email ?? null,
      };

      setUser(normalized);
      localStorage.setItem("user", JSON.stringify(normalized));
    } catch (err: any) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ✅ Logout sans page blanche */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const avatarInitials = (u?: User | null) =>
    u?.username ? u.username.charAt(0).toUpperCase() : "AM";

  return (
    <div className="flex h-screen" style={{ background: "#F1F3F5" }}>
      {/* Sidebar */}
      <aside className={`transition-all duration-300 shadow-sm ${collapsed ? "w-20" : "w-64"} bg-white border-r flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between" style={{ background: "#00A3E0", color: "white" }}>
          <div className="flex items-center gap-3">
            <div className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm" style={{ background: "#FFD100", color: "#0f172a" }}>
              AM
            </div>
            {!collapsed && (
              <div>
                <div className="text-sm font-semibold">Académie Militaire</div>
                <div className="text-xs opacity-90">FARDC</div>
              </div>
            )}
          </div>

          <Button size="sm" variant="ghost" onClick={() => setCollapsed(!collapsed)} className="text-white">
            <LucideMenu className="w-4 h-4" />
          </Button>
        </div>

        <nav className="p-3 flex-1 overflow-auto">
          {user &&
            navItems
              .filter((item) => item.roles.includes(user.role?.name ?? ""))
              .map((item) => (
                <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-md my-1 ${isActive(item.path) ? "bg-[#00A3E0] text-white" : "hover:bg-gray-100"}`}>
                  {item.icon}
                  {!collapsed && item.name}
                </Link>
              ))}
        </nav>

        <div className="p-3 border-t flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D71920] text-white flex items-center justify-center font-semibold">
            {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : avatarInitials(user)}
          </div>

          {!collapsed && (
            <div className="flex-1">
              <div className="text-sm font-medium">{user?.username}</div>
              <div className="text-xs text-gray-600">{user?.role?.name}</div>
            </div>
          )}

          <Button size="sm" variant="ghost" onClick={handleLogout}>
            <LucideLogOut className="w-4 h-4" />
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-3 shadow-sm bg-white">
          <h1 className="text-lg font-semibold">
            {navItems.find((n) => n.path === location.pathname)?.name || "Dashboard"}
          </h1>

          <Button size="sm" variant="outline" onClick={fetchProfile}>
            <LucideRefreshCw className="w-4 h-4 mr-2" /> Rafraîchir
          </Button>
        </header>

        <main className="flex-1 p-6 overflow-auto bg-[#F1F3F5]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
