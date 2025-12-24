import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import {
  User,
  BookOpen,
  FileText,
  Award,
  RefreshCcw,
  GraduationCap,
} from "lucide-react";

/* ================================
   TYPES
================================ */
interface StatsData {
  users?: number;
  students?: number;
  teachers?: number;
  modules?: number;
  notes?: number;
  bulletins?: number;
}

type Role = "admin" | "teacher" | "enseignant" | "student";

/* ================================
   COMPONENT
================================ */
const DashboardHome: React.FC = () => {
  const [role, setRole] = useState<Role>("admin");
  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ================================
     FETCH STATS
  ================================ */
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/dashboard/stats");

      // 🔥 FIX CRITIQUE : structure backend respectée
      setRole(res.data.role);
      setStats(res.data.stats || {});
    } catch (err: any) {
      console.error("Erreur fetchStats:", err);
      setError(
        err.response?.data?.message ||
          "Erreur de chargement des statistiques"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  /* ================================
     GRAPH DATA
  ================================ */
  const chartData =
    role === "student"
      ? [
          { name: "Notes", value: stats.notes || 0 },
          { name: "Bulletins", value: stats.bulletins || 0 },
        ]
      : role === "teacher" || role === "enseignant"
      ? [{ name: "Modules", value: stats.modules || 0 }]
      : [
          { name: "Elèves Officiers", value: stats.students || 0 },
          { name: "Enseignants", value: stats.teachers || 0 },
          { name: "Modules", value: stats.modules || 0 },
          { name: "Notes", value: stats.notes || 0 },
        ];

  const total = chartData.reduce((sum, i) => sum + i.value, 0);
  const percent = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

  /* ================================
     RENDER
  ================================ */
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCcw className="w-4 h-4 mr-1" />
          Actualiser
        </Button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          {/* ================================
              CARDS
          ================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ADMIN */}
            {role === "admin" && (
              <>
                <StatCard
                  title="Elèves Officiers"
                  value={stats.students || 0}
                  icon={<User />}
                  percent={percent(stats.students || 0)}
                />
                <StatCard
                  title="Enseignants"
                  value={stats.teachers || 0}
                  icon={<GraduationCap />}
                  percent={percent(stats.teachers || 0)}
                />
                <StatCard
                  title="Modules"
                  value={stats.modules || 0}
                  icon={<BookOpen />}
                  percent={percent(stats.modules || 0)}
                />
                <StatCard
                  title="Notes"
                  value={stats.notes || 0}
                  icon={<FileText />}
                  percent={percent(stats.notes || 0)}
                />
              </>
            )}

            {/* TEACHER */}
            {(role === "teacher" || role === "enseignant") && (
              <StatCard
                title="Mes Modules"
                value={stats.modules || 0}
                icon={<BookOpen />}
                percent={100}
              />
            )}

            {/* STUDENT */}
            {role === "student" && (
              <>
                <StatCard
                  title="Mes Notes"
                  value={stats.notes || 0}
                  icon={<FileText />}
                  percent={percent(stats.notes || 0)}
                />
                <StatCard
                  title="Mes Bulletins"
                  value={stats.bulletins || 0}
                  icon={<Award />}
                  percent={percent(stats.bulletins || 0)}
                />
              </>
            )}
          </div>

          {/* ================================
              CHART
          ================================ */}
          <Card>
            <CardHeader>
              <CardTitle>Vue d’ensemble</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

/* ================================
   REUSABLE CARD
================================ */
const StatCard = ({
  title,
  value,
  icon,
  percent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  percent: number;
}) => (
  <Card>
    <CardHeader className="flex flex-row justify-between items-center">
      <CardTitle>{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{value}</p>
      <Progress value={percent} className="mt-2" />
    </CardContent>
  </Card>
);

export default DashboardHome;
