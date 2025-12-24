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
    { name: "Notes des EO", path: "/dashboard/notes", icon: <LucideClipboard className="w-5 h-5" />, roles: ["admin", "secretary", "DE"] },
    { name: "Notes des EO", path: "/dashboard/NotesEnseignant", icon: <LucideClipboard className="w-5 h-5" />, roles: ["teacher"] },
    { name: "Mes Notes", path: "/dashboard/NotesEtudiant", icon: <LucideClipboard className="w-5 h-5" />, roles: ["student"] },
    { name: "Bulletins", path: "/dashboard/bulletins", icon: <LucideClipboard className="w-5 h-5" />, roles: ["admin", "secretary", "DE"] },
    { name: "Mon Bulletin", path: "/dashboard/MonBulletin", icon: <LucideClipboard className="w-5 h-5" />, roles: ["student"] },
    { name: "Présences", path: "/dashboard/presences", icon: <LucideCheckSquare className="w-5 h-5" />, roles: ["teacher"] },
    { name: "Présences", path: "/dashboard/presenceAdmin", icon: <LucideCheckSquare className="w-5 h-5" />, roles: ["secretary", "admin", "DE"] },
    { name: "Mes Présences", path: "/dashboard/PresencesEtudiant", icon: <LucideCheckSquare className="w-5 h-5" />, roles: ["student"] },
  ];

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    if (!token) return;
    setLoadingProfile(true);
    setAuthError(null);

    try {
      const res = await api.get("/auth/profile");
      const u = res.data?.user;
      if (u) {
        const normalized: User = {
          id: u.id,
          username: u.username ?? u.name ?? "Utilisateur",
          role: u.role ? { name: u.role.name } : undefined,
          avatarUrl: u.photoUrl ?? u.avatarUrl ?? null,
          email: u.email ?? null,
        };
        setUser(normalized);
        localStorage.setItem("user", JSON.stringify(normalized));
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
    <div className="flex h-screen bg-[#F1F3F5]">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ${collapsed ? "w-20" : "w-64"} bg-white border-r flex flex-col`}>
        <div className="p-4 flex justify-between items-center bg-[#00A3E0] text-white">
          <div className="font-bold">AM</div>
          <Button size="sm" variant="ghost" onClick={() => setCollapsed(!collapsed)}>
            <LucideMenu />
          </Button>
        </div>

        <nav className="p-3 flex-1 overflow-auto">
          {user &&
            navItems
              .filter((n) => n.roles.includes(user.role?.name ?? ""))
              .map((n) => (
                <Link
                  key={n.path}
                  to={n.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    isActive(n.path) ? "bg-[#00A3E0] text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {n.icon}
                  {!collapsed && n.name}
                </Link>
              ))}
        </nav>

        <div className="p-3 border-t">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2">
            <LucideLogOut /> {!collapsed && "Déconnexion"}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center px-6 py-3 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold">Dashboard</h1>

            {user && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white bg-[#00A3E0] w-full h-full flex items-center justify-center">
                      {avatarInitials(user)}
                    </span>
                  )}
                </div>

                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{user.username}</span>
                  <span className="text-xs text-gray-600 capitalize">{user.role?.name}</span>
                </div>
              </div>
            )}
          </div>

          <Button size="sm" variant="outline" onClick={fetchProfile}>
            <LucideRefreshCw className="w-4 h-4 mr-2" /> Rafraîchir
          </Button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
