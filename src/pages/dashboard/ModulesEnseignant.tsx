// src/pages/dashboard/ModulesEnseignant.tsx
import React, { useEffect, useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import type { AxiosProgressEvent } from "axios";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LucideBookOpen,
  LucideEdit,
  LucidePlus,
  LucideRefreshCw,
  LucideTrash2,
  LucideUpload,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";

type ModuleType = {
  id: string;
  title: string;
  code?: string;
  description?: string;
  semester?: number;
  credits?: number;
  promotion?: { nom: string } | null;
};

type ResourceType = {
  id: string;
  title: string;
  type: string;
  url: string;
  description?: string | null;
  moduleId: string;
};

const ModulesEnseignant: React.FC = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [modules, setModules] = useState<ModuleType[]>([]);
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null);

  const [resources, setResources] = useState<ResourceType[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "document",
    url: "",
    description: "",
    file: null as File | null,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Helper ---------- */
  const extractError = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const aerr = err as AxiosError<any>;
      return (
        aerr.response?.data?.message ??
        aerr.response?.data?.error ??
        aerr.message ??
        "Erreur inconnue"
      );
    }
    if (err instanceof Error) return err.message;
    return String(err);
  };

  /* ---------- Auto-clear messages ---------- */
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  /* ---------- Fetch Modules ---------- */
  const fetchModules = async () => {
    setErrorMsg(null);
    if (!headers) return setErrorMsg("Token manquant.");
    setLoadingModules(true);
    try {
      const res = await axios.get(`${API_BASE}/modules/my`, { headers });
      const data = res.data?.data ?? res.data ?? [];
      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(extractError(err));
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  /* ---------- Fetch Resources ---------- */
  const fetchResources = async (moduleId: string) => {
    setErrorMsg(null);
    if (!headers) return setErrorMsg("Token manquant.");
    setLoadingResources(true);
    try {
      const res = await axios.get(`${API_BASE}/resources/by-module/${moduleId}`, { headers });
      const data = res.data?.data ?? res.data ?? [];
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = extractError(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404) {
        setResources([]);
        setErrorMsg("Aucune ressource trouvée pour ce module.");
      } else {
        setErrorMsg(`Erreur chargement ressources: ${message}`);
      }
    } finally {
      setLoadingResources(false);
    }
  };

  const openResourcesForModule = async (module: ModuleType) => {
    setErrorMsg(null);
    setSuccessMsg(null); // 🧹 nettoie anciens messages
    setSelectedModule(module);
    await fetchResources(module.id);
  };

  /* ---------- Form open / close ---------- */
  const openForm = (resource?: ResourceType) => {
    setErrorMsg(null);
    setSuccessMsg(null); // 🧹 nettoie anciens messages
    if (resource) {
      setEditingResource(resource);
      setForm({
        title: resource.title,
        type: resource.type,
        url: resource.url,
        description: resource.description ?? "",
        file: null,
      });
    } else {
      setEditingResource(null);
      setForm({
        title: "",
        type: "document",
        url: "",
        description: "",
        file: null,
      });
    }
    setOpenDialog(true);
    setUploadProgress(null);
  };

  const closeForm = () => {
    setOpenDialog(false);
    setEditingResource(null);
    setForm({
      title: "",
      type: "document",
      url: "",
      description: "",
      file: null,
    });
    setUploadProgress(null);
    setUploading(false);
  };

  /* ---------- Upload avec métadonnées ---------- */
  const uploadFile = async (file: File): Promise<string> => {
    if (!headers) throw new Error("Token manquant.");
    const formData = new FormData();
    formData.append("file", file);
    if (selectedModule) formData.append("moduleId", selectedModule.id);
    if (form.title) formData.append("title", form.title);
    if (form.type) formData.append("type", form.type);
    if (form.description) formData.append("description", form.description);

    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await axios.post(`${API_BASE}/resources/upload`, formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });
      const url = res.data?.url;
      if (!url) throw new Error("Aucun URL renvoyé après upload.");
      return url;
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedModule) return setErrorMsg("Sélectionnez un module.");

    if (!form.title || (!form.url.trim() && !form.file)) {
      return setErrorMsg("Titre et lien/fichier requis.");
    }

    try {
      let finalUrl = form.url?.trim() ?? "";
      if (form.file) {
        finalUrl = await uploadFile(form.file);
      }

      const payload = {
        title: form.title.trim(),
        type: form.type,
        url: finalUrl,
        description: form.description?.trim() ?? "",
        moduleId: selectedModule.id,
      };

      if (editingResource) {
        await axios.put(`${API_BASE}/resources/${editingResource.id}`, payload, { headers });
        setSuccessMsg("Ressource mise à jour !");
      } else {
        await axios.post(`${API_BASE}/resources`, payload, { headers });
        setSuccessMsg("Ressource ajoutée !");
      }

      await fetchResources(selectedModule.id);
      closeForm();
    } catch (err) {
      setErrorMsg(extractError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette ressource ?")) return;
    try {
      await axios.delete(`${API_BASE}/resources/${id}`, { headers });
      setSuccessMsg("Ressource supprimée.");
      if (selectedModule) await fetchResources(selectedModule.id);
    } catch (err) {
      setErrorMsg(extractError(err));
    }
  };

  const onClickFileButton = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Mes modules (Cours)</CardTitle>
          <Button variant="outline" onClick={fetchModules}>
            <LucideRefreshCw className="w-4 h-4 mr-1" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {loadingModules ? (
            <p>Chargement...</p>
          ) : modules.length === 0 ? (
            <p>Aucun module trouvé.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((m) => (
                <Card key={m.id} className={`p-4 border ${selectedModule?.id === m.id ? "ring-2 ring-indigo-200" : ""}`}>
                  <h3 className="font-semibold text-lg">{m.title}</h3>
                  <p className="text-sm text-gray-600">
                    {m.code ?? "—"} — S{m.semester ?? "?"} ({m.credits ?? 0} crédits)
                  </p>
                  <p className="text-sm text-gray-500">{m.promotion?.nom ?? "Aucune promotion"}</p>
                  <div className="mt-3">
                    <Button
                      variant={selectedModule?.id === m.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => openResourcesForModule(m)}
                    >
                      <LucideBookOpen className="w-4 h-4 mr-1" /> Ressources
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedModule && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Ressources — {selectedModule.title}</CardTitle>
            <Button onClick={() => openForm()} className="bg-blue-600 text-white">
              <LucidePlus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            {successMsg && (
              <p className="text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-md mb-2">
                {successMsg}
              </p>
            )}
            {errorMsg && (
              <p className="text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md mb-2">
                {errorMsg}
              </p>
            )}

            {loadingResources ? (
              <p>Chargement...</p>
            ) : resources.length === 0 ? (
              <p className="text-gray-500">Aucune ressource.</p>
            ) : (
              <div className="overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Titre</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Lien</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{r.title}</td>
                        <td className="px-3 py-2">{r.type}</td>
                        <td className="px-3 py-2 text-blue-600 underline">
                          <a href={r.url} target="_blank" rel="noopener noreferrer">Ouvrir</a>
                        </td>
                        <td className="px-3 py-2">
                          {r.description && r.description.trim() !== "" ? r.description : "—"}
                        </td>
                        <td className="px-3 py-2 flex justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openForm(r)}>
                            <LucideEdit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
                            <LucideTrash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Modifier la ressource" : "Nouvelle ressource"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm">Titre</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="border rounded px-2 py-2 w-full"
              >
                <option value="document">Document</option>
                <option value="lien">Lien</option>
                <option value="video">Vidéo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm">Lien ou fichier</label>
              <div className="flex items-center gap-2">
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
                />
                <Button type="button" variant="outline" onClick={onClickFileButton}>
                  <LucideUpload className="w-4 h-4" /> Fichier
                </Button>
              </div>
              {form.file && <p className="text-sm text-gray-600 mt-1">Fichier : {form.file.name}</p>}
              {uploadProgress !== null && <p className="text-sm text-gray-600">Upload : {uploadProgress}%</p>}
            </div>

            <div>
              <label className="block text-sm">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border rounded px-2 py-2 w-full"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Upload..." : editingResource ? "Modifier" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModulesEnseignant;
