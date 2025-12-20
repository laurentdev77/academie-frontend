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

interface StatsData {
  students?: number;
  teachers?: number;
  modules?: number;
  notes?: number;
  bulletins?: number;
  notesForStudent?: number;
  bulletinsForStudent?: number;
}

const DashboardHome: React.FC = () => {
  const role = localStorage.getItem("role") || "admin";

  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err: any) {
      console.error("Erreur fetchStats:", err);
      setError(err.response?.data?.message || "Erreur de chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  // Données du graphique
  const chartData =
    role === "student"
      ? [
          { name: "Notes", value: stats.notesForStudent || 0 },
          { name: "Bulletins", value: stats.bulletinsForStudent || 0 },
        ]
      : [
          { name: "Elèves Officiers", value: stats.students || 0 },
          { name: "Enseignants", value: stats.teachers || 0 },
          { name: "Modules", value: stats.modules || 0 },
          { name: "Notes", value: stats.notes || 0 },
        ];

  const total =
    role === "student"
      ? (stats.notesForStudent || 0) + (stats.bulletinsForStudent || 0)
      : (stats.students || 0) +
        (stats.teachers || 0) +
        (stats.modules || 0) +
        (stats.notes || 0);

  const percent = (value: number) => (total ? (value / total) * 100 : 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCcw className="w-4 h-4 mr-1" /> Actualiser
        </Button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          {/* Cartes statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {role !== "student" ? (
              <>
                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>Elèves Officiers</CardTitle>
                    <User className="text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.students || 0}</p>
                    <Progress value={percent(stats.students || 0)} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>Enseignants</CardTitle>
                    <GraduationCap className="text-indigo-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.teachers || 0}</p>
                    <Progress value={percent(stats.teachers || 0)} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>Modules</CardTitle>
                    <BookOpen className="text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.modules || 0}</p>
                    <Progress value={percent(stats.modules || 0)} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>Notes</CardTitle>
                    <FileText className="text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.notes || 0}</p>
                    <Progress value={percent(stats.notes || 0)} className="mt-2" />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>Mes Notes</CardTitle>
                    <FileText className="text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.notesForStudent || 0}</p>
                    <Progress value={percent(stats.notesForStudent || 0)} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>Mes Bulletins</CardTitle>
                    <Award className="text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.bulletinsForStudent || 0}</p>
                    <Progress value={percent(stats.bulletinsForStudent || 0)} className="mt-2" />
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Graphique */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Vue d’ensemble</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
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

export default DashboardHome;
