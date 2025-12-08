// Enseignants.tsx (version complète corrigée)
// Remplace entièrement ton fichier par ce contenu.

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  LucidePlus,
  LucideEdit,
  LucideTrash2,
  LucideRefreshCw,
  LucideDownload,
  LucideEye,
  LucideUserPlus,
  LucideLink,
} from "lucide-react";

type Teacher = {
  id?: string | number;
  nom?: string;
  prenom?: string;
  grade?: string;
  specialite?: string;
  userId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  photoUrl?: string | null;
  email?: string | null;
  telephone?: string | null;
};

type User = {
  id: string;
  username: string;
  email: string;
  roleId?: number;
  telephone?: string | null;
};

const PAGE_SIZE_OPTIONS = [8, 12, 20];
const API = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

const EnseignantsPage: React.FC = () => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  // data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // UI & filters
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [specFilter, setSpecFilter] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  // dialogs / forms
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  // form state
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    grade: "",
    specialite: "",
    email: "",
    telephone: "",
    mode: "create" as "create" | "link",
    userToLinkId: "",
    usernameForNewUser: "",
    passwordForNewUser: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // derived lists for filters
  const grades = useMemo(
    () =>
      Array.from(
        new Set(
          teachers
            .map((t) => (t.grade ?? "").trim())
            .filter((v) => v && v.length > 0)
        )
      ),
    [teachers]
  );

  const specialites = useMemo(
    () =>
      Array.from(
        new Set(
          teachers
            .map((t) => (t.specialite ?? "").trim())
            .filter((v) => v && v.length > 0)
        )
      ),
    [teachers]
  );

  // auto hide messages
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // fetch teachers (use /api/teachers)
  const fetchTeachers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.get(`${API}/teachers`, {
        headers,
      });
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? res.data?.teachers ?? res.data;
      const arr = Array.isArray(data) ? data : data.rows ?? [];
      setTeachers(arr);
    } catch (err: any) {
      console.error("fetchTeachers error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur chargement enseignants");
    } finally {
      setLoading(false);
    }
  };

  // fetch users for linking
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`, { headers });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.users ?? res.data;
      setUsers(Array.isArray(data) ? data : data.rows ?? []);
    } catch (err: any) {
      console.warn("fetchUsers error:", err);
      // not fatal - display no users
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when filters change, reset page and refetch (debounced client-side)
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchTeachers(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, gradeFilter, specFilter]);

  // Fix URL photo: always return an absolute URL for img src
  const getPhotoUrl = (path?: string | null) => {
    if (!path) return null;
    // If backend already returned full URL, keep it
    if (path.startsWith("http")) return path;
    // ensure leading slash
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${API}${normalized}`;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      nom: "",
      prenom: "",
      grade: "",
      specialite: "",
      email: "",
      telephone: "",
      mode: "create",
      userToLinkId: "",
      usernameForNewUser: "",
      passwordForNewUser: "",
    });
    setPhotoFile(null);
    setOpenForm(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm((prev) => ({
      ...prev,
      nom: t.nom ?? "",
      prenom: t.prenom ?? "",
      grade: t.grade ?? "",
      specialite: t.specialite ?? "",
      email: t.email ?? "",
      telephone: t.telephone ?? "",
    }));
    setPhotoFile(null);
    setOpenForm(true);
  };

  const openDetail = (t: Teacher) => {
    setEditing(t);
    setOpenView(true);
  };

  const handleFileChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = evt.target.files?.[0] ?? null;
    setPhotoFile(f);
  };

  // helper: robust upload photo (tries teacher-specific route first, falls back to generic upload)
  const uploadPhoto = async (teacherId: string | number, file: File | null) => {
    if (!file) return null;
    try {
      const fd = new FormData();
      fd.append("photo", file);

      // 1) Try teacher-specific upload endpoint (if your backend exposes it)
      try {
        const res = await axios.post(`${API}/teachers/${teacherId}/photo`, fd, {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        });
        // If successful, controller may return { photoUrl: "/uploads/photos/xxx" } or similar
        return res.data?.photoUrl ?? res.data?.url ?? null;
      } catch (errInner: any) {
        // If 404 or not available, fallback to generic upload endpoint
        console.info("teacher-specific upload failed, falling back to /api/upload-photo", errInner?.response?.status);
      }

      // 2) Fallback to generic upload route
      const res2 = await axios.post(`${API}/upload-photo`, fd, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });
      const returnedUrl = res2.data?.url ?? res2.data?.photoUrl ?? null;

      // If the generic upload only stores file and returns url, we need to save it on teacher record
      if (returnedUrl) {
        // update teacher record with returned URL (non-fatal)
        try {
          await axios.put(`${API}/teachers/${teacherId}`, { photoUrl: returnedUrl }, { headers });
        } catch (errUpd) {
          console.warn("Failed to set teacher.photoUrl after generic upload:", errUpd);
        }
      }

      return returnedUrl ?? null;
    } catch (err: any) {
      console.error("uploadPhoto error:", err);
      setErrorMsg(err?.response?.data?.message || "Erreur upload photo");
      return null;
    }
  };

  // submit create/update
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!form.nom || form.nom.trim().length < 2) {
      setErrorMsg("Le nom est requis (≥2 caractères).");
      return;
    }

    try {
      if (editing) {
        // update existing teacher
        const payload = {
          nom: form.nom,
          prenom: form.prenom,
          grade: form.grade,
          specialite: form.specialite,
          email: form.email,
          telephone: form.telephone,
        };
        await axios.put(`${API}/teachers/${editing.id}`, payload, { headers });

        if (photoFile) {
          const newPhoto = await uploadPhoto(editing.id as string | number, photoFile);
          if (newPhoto) {
            // update local state for quick feedback
            setTeachers((prev) =>
              prev.map((t) => (t.id === editing.id ? { ...t, photoUrl: newPhoto } : t))
            );
          }
        }
        setSuccessMsg("Enseignant mis à jour.");
      } else {
        // create new teacher
        if (form.mode === "create") {
          const payload = {
            nom: form.nom,
            prenom: form.prenom,
            grade: form.grade,
            specialite: form.specialite,
            email: form.email,
            telephone: form.telephone,
            username: form.usernameForNewUser || form.email || form.nom,
            password: form.passwordForNewUser || "123456",
            createUser: true,
          };
          const res = await axios.post(`${API}/teachers`, payload, { headers });
          const createdId = res.data?.teacher?.id ?? res.data?.id ?? null;
          if (photoFile && createdId) {
            const newPhoto = await uploadPhoto(createdId, photoFile);
            if (newPhoto) {
              // ensure teacher record has photoUrl (controller may already)
              try {
                await axios.put(`${API}/teachers/${createdId}`, { photoUrl: newPhoto }, { headers });
              } catch {}
            }
          }
          setSuccessMsg("Enseignant créé.");
        } else {
          // link to existing user
          if (!form.userToLinkId) {
            setErrorMsg("Choisissez un utilisateur à lier.");
            return;
          }
          const payload = {
            nom: form.nom,
            prenom: form.prenom,
            grade: form.grade,
            specialite: form.specialite,
            userId: form.userToLinkId,
          };
          const res = await axios.post(`${API}/teachers`, payload, { headers });
          const createdId = res.data?.teacher?.id ?? res.data?.id ?? null;

          // elevate user role to teacher
          try {
            await axios.put(`${API}/users/${form.userToLinkId}/role`, { roleId: 2 }, { headers });
          } catch (err) {
            console.warn("Failed to update user role:", err);
          }

          if (photoFile && createdId) {
            const newPhoto = await uploadPhoto(createdId, photoFile);
            if (newPhoto) {
              try {
                await axios.put(`${API}/teachers/${createdId}`, { photoUrl: newPhoto }, { headers });
              } catch {}
            }
          }

          setSuccessMsg("Enseignant lié à l'utilisateur.");
        }
      }

      // refresh list and close modal
      await fetchTeachers();
      setTimeout(() => {
        setOpenForm(false);
        setEditing(null);
        setPhotoFile(null);
      }, 250);
    } catch (err: any) {
      console.error("save teacher error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur sauvegarde enseignant");
    }
  };

  // delete
  const handleDelete = async (id?: string | number) => {
    if (!id) return;
    if (!window.confirm("Supprimer cet enseignant ?")) return;
    try {
      await axios.delete(`${API}/teachers/${id}`, { headers });
      setSuccessMsg("Enseignant supprimé.");
      await fetchTeachers();
    } catch (err: any) {
      console.error("delete teacher error:", err);
      setErrorMsg(err.response?.data?.message || "Erreur suppression enseignant");
    }
  };

  // export CSV/JSON
  const exportCSV = () => {
    if (!teachers.length) return;
    const header = ["id", "nom", "prenom", "grade", "specialite", "email", "telephone", "createdAt"];
    const rows = teachers.map((t) => [
      String(t.id ?? ""),
      t.nom ?? "",
      t.prenom ?? "",
      t.grade ?? "",
      t.specialite ?? "",
      t.email ?? "",
      t.telephone ?? "",
      t.createdAt ? dayjs(t.createdAt).format("YYYY-MM-DD") : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enseignants_${dayjs().format("YYYYMMDD_HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(teachers, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enseignants_${dayjs().format("YYYYMMDD_HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // client-side filtering/pagination
  const paginated = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = teachers.filter((t) => {
      const inSearch =
        !q ||
        (t.nom && t.nom.toLowerCase().includes(q)) ||
        (t.prenom && t.prenom.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q));
      const inGrade = !gradeFilter || (t.grade ?? "") === gradeFilter;
      const inSpec = !specFilter || (t.specialite ?? "") === specFilter;
      return inSearch && inGrade && inSpec;
    });

    const sorted = filtered.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);
    return { items, total, totalPages };
  }, [teachers, search, gradeFilter, specFilter, page, pageSize]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Gestion des Enseignants</h1>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher (nom / prénom / email)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80"
          />

          <Select
            value={gradeFilter ?? "all"}
            onValueChange={(v) => setGradeFilter(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={specFilter ?? "all"}
            onValueChange={(v) => setSpecFilter(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrer spécialité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {specialites.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              setSearch("");
              setGradeFilter(null);
              setSpecFilter(null);
              fetchTeachers();
            }}
            variant="outline"
          >
            <LucideRefreshCw className="w-4 h-4 mr-2" /> Actualiser
          </Button>

          <Button onClick={openCreate} className="bg-blue-600 text-white">
            <LucidePlus className="w-4 h-4 mr-2" /> Ajouter
          </Button>
        </div>
      </div>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      {successMsg && <p className="text-green-600">{successMsg}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Liste des enseignants</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Photo</th>
                      <th className="px-3 py-2 text-left">Nom & Prénom</th>
                      <th className="px-3 py-2 text-left">Grade</th>
                      <th className="px-3 py-2 text-left">Spécialité</th>
                      <th className="px-3 py-2 text-left">Email / Tél.</th>
                      <th className="px-3 py-2 text-left">Créé le</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.items.map((t) => (
                      <tr key={String(t.id)} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">
                          {t.photoUrl ? (
                            <img
                              src={getPhotoUrl(t.photoUrl) || undefined}
                              alt={`${t.nom}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500">
                              N/A
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          <div className="font-medium">{t.nom ?? "—"}</div>
                          <div className="text-xs text-gray-500">{t.prenom ?? ""}</div>
                          {t.userId && <div className="text-xs text-blue-600">lié à user</div>}
                        </td>

                        <td className="px-3 py-2">{t.grade ?? "—"}</td>
                        <td className="px-3 py-2">{t.specialite ?? "—"}</td>

                        <td className="px-3 py-2">
                          <div>{t.email ?? "—"}</div>
                          <div className="text-xs text-gray-500">{t.telephone ?? ""}</div>
                        </td>

                        <td className="px-3 py-2">{t.createdAt ? dayjs(t.createdAt).format("YYYY-MM-DD") : "—"}</td>

                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => openDetail(t)}>
                              <LucideEye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                              <LucideEdit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>
                              <LucideTrash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {paginated.items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                          Aucune donnée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  {paginated.total} résultat(s) — page {page} / {paginated.totalPages}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border rounded px-2 py-1"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s} / page
                      </option>
                    ))}
                  </select>

                  <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Préc
                  </Button>
                  <Button variant="outline" onClick={() => setPage((p) => Math.min(paginated.totalPages, p + 1))}>
                    Suiv
                  </Button>

                  <Button variant="ghost" onClick={exportCSV} title="Exporter CSV">
                    <LucideDownload className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" onClick={exportJSON} title="Exporter JSON">
                    <LucideDownload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* FORM DIALOG */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier Enseignant" : "Ajouter Enseignant"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            </div>

            <div>
              <Input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>

            <div>
              <Input placeholder="Grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </div>

            <div>
              <Input placeholder="Spécialité" value={form.specialite} onChange={(e) => setForm({ ...form, specialite: e.target.value })} />
            </div>

            <div>
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <Input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>

            {/* user linking controls */}
            {!editing && (
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant={form.mode === "create" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, mode: "create" })}
                  >
                    <LucideUserPlus className="w-4 h-4 mr-2" /> Créer un utilisateur
                  </Button>

                  <Button
                    variant={form.mode === "link" ? "default" : "outline"}
                    onClick={() => {
                      setForm({ ...form, mode: "link" });
                      fetchUsers();
                    }}
                  >
                    <LucideLink className="w-4 h-4 mr-2" /> Lier un utilisateur
                  </Button>
                </div>

                {form.mode === "create" && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input placeholder="Nom utilisateur (login)" value={form.usernameForNewUser} onChange={(e) => setForm({ ...form, usernameForNewUser: e.target.value })} />
                    <Input placeholder="Mot de passe (par défaut 123456)" value={form.passwordForNewUser} onChange={(e) => setForm({ ...form, passwordForNewUser: e.target.value })} />
                  </div>
                )}

                {form.mode === "link" && (
                  <div className="space-y-2 mt-3">
                    <div className="text-xs text-gray-500">Choisir l'utilisateur à lier</div>
                    <select
                      value={form.userToLinkId}
                      onChange={(e) => setForm({ ...form, userToLinkId: e.target.value })}
                      className="w-full border rounded px-2 py-2"
                    >
                      <option value="">-- Choisir un utilisateur --</option>
                      {users
                        .filter((u) => u.roleId !== 2) // ignore already teachers if possible
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} — {u.email}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm mb-2">Photo (optionnel)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {photoFile && <div className="text-sm mt-1">{photoFile.name}</div>}

              {/* Preview */}
              <div className="w-24 h-24 rounded-full overflow-hidden border mt-3">
                <img
                  src={
                    photoFile
                      ? URL.createObjectURL(photoFile)
                      : getPhotoUrl(editing?.photoUrl ?? "") ?? undefined
                  }
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <DialogFooter className="col-span-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                Annuler
              </Button>

              <Button type="submit" className="ml-2">
                {editing ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails Enseignant</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {editing.photoUrl ? (
                  <img src={getPhotoUrl(editing.photoUrl) || undefined} alt="photo" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500">N/A</div>
                )}
                <div>
                  <div className="text-lg font-semibold">{editing.nom} {editing.prenom}</div>
                  <div className="text-sm text-gray-600">{editing.grade} - {editing.specialite}</div>
                  <div className="text-xs text-gray-500">UserId: {editing.userId ?? "—"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div>{editing.email ?? "—"}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Téléphone</div>
                <div>{editing.telephone ?? "—"}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Créé le</div>
                <div>{editing.createdAt ? dayjs(editing.createdAt).format("YYYY-MM-DD HH:mm") : "—"}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenView(false)}>Fermer</Button>
            <Button onClick={() => { setOpenView(false); openEdit(editing as Teacher); }}>Modifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnseignantsPage;
