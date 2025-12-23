// src/pages/dashboard/ModulesEtudiant.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LucideFileText,
  LucideVideo,
  LucideDownload,
  LucideEye,
  LucideSearch,
  LucideArchive,
  LucideMoon,
  LucideSun,
  LucideMenu,
  LucideX,
} from "lucide-react";

/* ======================= URL FIX ======================= */
const API_BASE =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
const BACKEND_BASE = API_BASE.replace("/api", "");
const fixUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url.replace("http://", "https://");
  return `${BACKEND_BASE}${url.startsWith("/") ? url : `/${url}`}`;
};

/* ------------------------- Types ------------------------- */
type Resource = {
  id: string;
  title: string;
  type: "video" | "pdf" | "document" | "other";
  url: string;
  description?: string | null;
  createdAt?: string;
};

type PromotionInfo = {
  id: number;
  nom: string;
  annee: number;
};

type ModuleShape = {
  id: string;
  title?: string;
  code?: string;
  description?: string;
  credits?: number;
  semester?: number;
  promotion?: PromotionInfo | null;
  resources?: Resource[];
  teacher?: { username?: string; email?: string } | null;
};

/* ------------------------- Component ------------------------- */
export default function ModulesEtudiant() {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [modules, setModules] = useState<ModuleShape[]>([]);
  const [promotion, setPromotion] = useState<PromotionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleShape | null>(null);
  const [query, setQuery] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("prefers_dark");
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });

  const [pdfPreview, setPdfPreview] = useState<Resource | null>(null);
  const [videoPreview, setVideoPreview] = useState<Resource | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const seenKey = "seen_resources";
  const getSeen = () => {
    try {
      const raw = localStorage.getItem(seenKey);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  };
  const [seen, setSeen] = useState<string[]>(getSeen());

  useEffect(() => {
    localStorage.setItem(seenKey, JSON.stringify(seen));
  }, [seen]);
  useEffect(() => {
    localStorage.setItem("prefers_dark", JSON.stringify(darkMode));
  }, [darkMode]);

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/students/mes-modules", { headers });
      const data = res.data;

      console.log("Fetched modules:", data.modules); // debug
      setPromotion(data.promotion ?? null);
      setModules(Array.isArray(data.modules) ? data.modules : []);
      setSelectedModule(
        Array.isArray(data.modules) && data.modules.length > 0
          ? data.modules[0]
          : null
      );
    } catch (err: any) {
      console.error("fetchModules error:", err);
      setError(
        err.response?.data?.message ?? "Erreur lors du chargement des modules."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        (m.title ?? "").toLowerCase().includes(q) ||
        (m.code ?? "").toLowerCase().includes(q) ||
        (m.teacher?.username ?? "").toLowerCase().includes(q)
    );
  }, [modules, query]);

  const openResource = (r: Resource) => {
    if (r.type === "pdf") setPdfPreview(r);
    else if (r.type === "video") setVideoPreview(r);
    else window.open(fixUrl(r.url), "_blank", "noopener,noreferrer");
    if (!seen.includes(r.id)) setSeen((s) => [...s, r.id]);
  };

  const toggleSeen = (id: string) => {
    setSeen((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const downloadResource = (r: Resource) => {
    const link = document.createElement("a");
    link.href = fixUrl(r.url);
    link.download = r.title || "resource";
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (!seen.includes(r.id)) setSeen((s) => [...s, r.id]);
  };

  const downloadAllZip = async (mod: ModuleShape) => {
    if (!mod.resources || mod.resources.length === 0) return;
    try {
      const zip = new JSZip();
      const folder = zip.folder((mod.title || "module").replace(/\s+/g, "_"))!;
      await Promise.all(
        mod.resources.map(async (r) => {
          try {
            const resp = await fetch(fixUrl(r.url));
            const blob = await resp.blob();
            const ext = r.type === "pdf" ? ".pdf" : "";
            const filename = `${(r.title || "resource").replace(/[^\w.-]/g, "_")}${ext}`;
            folder.file(filename, blob);
          } catch (e) {
            console.warn("skip resource in zip:", r.url, e);
          }
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${(mod.title || "module").replace(/\s+/g, "_")}_resources.zip`);
    } catch (err) {
      console.error("downloadAllZip error:", err);
      setError("Erreur lors du téléchargement ZIP.");
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen((s) => !s)} className={`p-2 rounded ${darkMode ? "bg-gray-800" : "bg-white"} shadow`} title="Toggle menu">
                <LucideMenu className="w-5 h-5" />
              </button>

              <h1 className="text-2xl font-semibold">Mes Modules</h1>

              {promotion && (
                <div className={`ml-4 px-3 py-1 rounded text-sm ${darkMode ? "bg-gray-800" : "bg-white"} border`}>
                  {promotion.nom ?? "—"} — {promotion.annee ?? "—"}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded px-2 py-1">
                <LucideSearch className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher module, code ou enseignant..."
                  className="outline-none bg-transparent text-sm w-64"
                />
              </div>
              <Button onClick={fetchModules} variant="outline">Rafraîchir</Button>
              <button onClick={() => setDarkMode((d) => !d)} className={`p-2 rounded ${darkMode ? "bg-gray-700 text-yellow-300" : "bg-white"} shadow`} title="Toggle dark">
                {darkMode ? <LucideSun className="w-5 h-5" /> : <LucideMoon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Sidebar */}
            <aside className={`md:col-span-3 ${sidebarOpen ? "" : "hidden md:block"}`}>
              <div className={`p-4 rounded shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <nav className="space-y-2">
                  <button
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => { if (modules.length) setSelectedModule(modules[0]); }}
                  >
                    Tableau de bord
                  </button>
                  <hr className="my-2" />
                  <div className="text-xs text-gray-400 mb-2">Vos modules</div>
                  <div className="space-y-1 max-h-64 overflow-auto">
                    {modules.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModule(m)}
                        className={`w-full text-left px-2 py-2 rounded flex items-center justify-between ${selectedModule?.id === m.id ? (darkMode ? "bg-gray-700 text-white" : "bg-blue-50") : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                      >
                        <div>
                          <div className="text-sm font-medium">{m.title ?? "—"}</div>
                          <div className="text-xs text-gray-400">{m.code ?? "—"}</div>
                        </div>
                        <div className="text-xs text-gray-400">{m.resources?.length ?? 0}</div>
                      </button>
                    ))}
                  </div>
                </nav>
              </div>
            </aside>

            {/* Content */}
            <main className="md:col-span-9">
              {selectedModule ? (
                <Card className={`${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <CardHeader>
                    <CardTitle>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">{selectedModule.title ?? "—"}</div>
                          <div className="text-xs text-gray-400">{selectedModule.code ?? "—"} • {selectedModule.teacher?.username ?? "—"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-400 mr-2">Promotion: {selectedModule.promotion?.nom ?? "—"}</div>
                          <Button size="sm" variant="outline" onClick={() => downloadAllZip(selectedModule)}>
                            <LucideArchive className="w-4 h-4" /> Tout télécharger
                          </Button>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">{selectedModule.description ?? "Aucune description fournie."}</p>
                    {/* resources */}
                    {(!selectedModule.resources || selectedModule.resources.length === 0) ? (
                      <div className="p-3 bg-gray-50 rounded text-sm">Aucune ressource disponible.</div>
                    ) : (
                      <div className="space-y-3">
                        {selectedModule.resources.map((r) => (
                          <div key={r.id} className={`flex items-center justify-between p-3 rounded border ${darkMode ? "border-gray-700" : ""}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                {r.type === "video" ? <LucideVideo className="w-5 h-5" /> : <LucideFileText className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="font-medium">{r.title ?? "—"}</div>
                                <div className="text-xs text-gray-400">{r.description ?? ""}</div>
                                <div className="text-xs text-gray-500 mt-1">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => openResource(r)}>Ouvrir</Button>
                              {r.type !== "video" && (
                                <Button size="sm" variant="outline" onClick={() => downloadResource(r)}>
                                  <LucideDownload className="w-4 h-4" />
                                </Button>
                              )}
                              <button
                                className={`p-2 rounded ${seen.includes(r.id) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                                onClick={() => toggleSeen(r.id)}
                                title={seen.includes(r.id) ? "Marqué comme non lu" : "Marquer comme lu"}
                              >
                                <LucideEye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className={`p-6 rounded ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  Sélectionne un module pour voir les ressources.
                </div>
              )}
              {error && <div className="text-red-600 mb-4">{error}</div>}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
