// src/pages/dashboard/Utilisateurs.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LucideUser,
  LucideTrash2,
  LucideRefreshCw,
  LucideEdit,
  LucidePlus,
  LucideEye,
  LucideDownload,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// TYPES
type Role = { id: number; name: string };
type Student = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  userId?: string | null;
  promotion?: { id: number; nom?: string; filiere?: { nom?: string } } | null;
};
type Teacher = {
  id: string;
  nom?: string;
  prenom?: string;
  userId?: string | null;
  grade?: string;
  specialite?: string;
};
type User = {
  id: string;
  username: string;
  email: string;
  telephone?: string | null;
  photoUrl?: string | null;
  status: "active" | "inactive";
  role?: Role | null;
  createdAt: string;
};

// URL API dynamique
const API = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

// UTILS
const getPhotoUrl = (url?: string) => {
  if (!url) return "/default-avatar.png";
  return url.startsWith("http") ? url : `${API}${url}`;
};

export default function Utilisateurs() {
  // STATES
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  const [selectedStudentIdToLink, setSelectedStudentIdToLink] = useState<string>("");
  const [selectedTeacherIdToLink, setSelectedTeacherIdToLink] = useState<string>("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  // ======================
  // FETCH FUNCTIONS
  // ======================
  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API}/users/roles`, { headers });
      setRoles(Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.roles);
    } catch (err) {
      console.error("fetchRoles:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/students`, { headers });
      setStudents(Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.rows);
    } catch (err) {
      console.error("fetchStudents:", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teachers`, { headers });
      const data = Array.isArray(res.data) || res.data?.teacher || res.data?.teachers || res.data?.data
        ? res.data
        : [];
      setTeachers(Array.isArray(data) ? data : data?.rows ?? data?.teachers ?? data?.data ?? []);
    } catch (err) {
      console.error("fetchTeachers:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/users`, { headers });
      setUsers(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (err) {
      console.error("fetchUsers:", err);
      alert("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchStudents();
    fetchTeachers();
    fetchUsers();
  }, []);

  // ======================
  // UPLOAD PHOTO
  // ======================
  const uploadPhoto = async (file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await axios.post(`${API}/upload-photo`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      return res.data?.url ?? null;
    } catch (err) {
      console.error("uploadPhoto:", err);
      alert("Échec upload photo");
      return null;
    }
  };

  // ======================
  // FILTERS
  // ======================
  const studentsWithoutUser = useMemo(() => students.filter((s) => !s.userId), [students]);
  const teachersWithoutUser = useMemo(() => teachers.filter((t) => !t.userId), [teachers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && String(u.role?.id) !== String(roleFilter)) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.telephone || "").toLowerCase().includes(q) ||
        (u.role?.name || "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  // ======================
  // SUBMIT FORM
  // ======================
  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let photoUrl = editingUser?.photoUrl ?? null;
    if (photoFile) {
      const uploaded = await uploadPhoto(photoFile);
      if (uploaded) photoUrl = uploaded;
    }

    const payload: any = {
      username: formData.get("username")?.toString().trim(),
      email: formData.get("email")?.toString().trim(),
      telephone: formData.get("telephone")?.toString().trim() || null,
      photoUrl,
      roleId: formData.get("roleId") ? Number(formData.get("roleId")) : null,
      status: (formData.get("status")?.toString() as "active" | "inactive") || "inactive",
    };

    const pw = formData.get("password")?.toString();
    if (!editingUser || pw) payload.password = pw;

    try {
      setLoading(true);

      if (editingUser) {
        // UPDATE
        const res = await axios.put(`${API}/users/${editingUser.id}`, payload, { headers });
        const updatedUser = res.data?.user ?? res.data ?? null;
        if (updatedUser) {
          setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        } else {
          await fetchUsers();
        }

        // Link Student
        if (selectedStudentIdToLink) {
          await axios.put(
            `${API}/users/${editingUser.id}/link-student/${selectedStudentIdToLink}`,
            {},
            { headers }
          );
          await fetchStudents();
          await fetchUsers();
          setSelectedStudentIdToLink("");
        }

        // Link Teacher
        if (selectedTeacherIdToLink) {
          await axios.put(
            `${API}/teachers/link-user/${selectedTeacherIdToLink}`,
            { teacherId: selectedTeacherIdToLink, userId: editingUser.id },
            { headers }
          );
          await fetchTeachers();
          await fetchUsers();
          setSelectedTeacherIdToLink("");
        }

        alert("Utilisateur mis à jour");
      } else {
        // CREATE
        const res = await axios.post(`${API}/users`, payload, { headers });
        const newUser = res.data?.user ?? res.data ?? null;
        if (newUser) setUsers((prev) => [newUser, ...prev]);

        if (selectedStudentIdToLink) {
          await axios.put(
            `${API}/users/${newUser.id}/link-student/${selectedStudentIdToLink}`,
            {},
            { headers }
          );
          await fetchStudents();
          await fetchUsers();
          setSelectedStudentIdToLink("");
        }

        if (selectedTeacherIdToLink) {
          await axios.put(
            `${API}/teachers/link-user/${selectedTeacherIdToLink}`,
            { teacherId: selectedTeacherIdToLink, userId: newUser.id },
            { headers }
          );
          await fetchTeachers();
          await fetchUsers();
          setSelectedTeacherIdToLink("");
        }

        alert("Utilisateur créé");
      }

      setOpenForm(false);
      setEditingUser(null);
      setPhotoFile(null);
    } catch (err: any) {
      console.error("submitForm:", err);
      alert(err?.response?.data?.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // DELETE USER
  // ======================
  const deleteUser = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    try {
      await axios.delete(`${API}/users/${id}`, { headers });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("deleteUser:", err);
      alert("Erreur suppression utilisateur");
    }
  };

  // ======================
  // OPEN FORMS
  // ======================

  const openCreate = () => {
    setEditingUser(null);
    setSelectedStudentIdToLink("");
    setSelectedTeacherIdToLink("");
    setPhotoFile(null);
    setOpenForm(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setSelectedStudentIdToLink("");
    setSelectedTeacherIdToLink("");
    setPhotoFile(null);
    setOpenForm(true);
  };

  // ======================
  // EXPORT PDF & EXCEL
  // ======================

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des utilisateurs", 14, 14);

    const head = [["Nom", "Email", "Téléphone", "Rôle", "Statut"]];
    const body = filteredUsers.map((u) => [
      u.username,
      u.email,
      u.telephone || "-",
      u.role?.name || "-",
      u.status,
    ]);

    autoTable(doc, { startY: 24, head, body });
    doc.save("utilisateurs.pdf");
  };

  const exportExcel = () => {
    const rows = filteredUsers.map((u) => ({
      Nom: u.username,
      Email: u.email,
      Téléphone: u.telephone || "",
      Rôle: u.role?.name || "",
      Statut: u.status,
      "Créé le": new Date(u.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");
    XLSX.writeFile(wb, "utilisateurs.xlsx");
  };
// PARTIE 3/3 — Utilisateurs.tsx (FIN)

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between gap-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <LucideUser className="w-5 h-5" />
            Gestion des utilisateurs
          </CardTitle>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Recherche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">— Tous rôles —</option>
              {roles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">— Tous statuts —</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                fetchUsers();
                fetchStudents();
                fetchTeachers();
              }}
              disabled={loading}
            >
              <LucideRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button onClick={openCreate} className="bg-blue-600 text-white">
              <LucidePlus className="w-4 h-4 mr-1" /> Ajouter
            </Button>

            <Button variant="outline" onClick={exportPDF}>
              <LucideDownload className="w-4 h-4 mr-1" /> PDF
            </Button>

            <Button variant="outline" onClick={exportExcel}>
              <LucideDownload className="w-4 h-4 mr-1" /> Excel
            </Button>
          </div>
        </CardHeader>

        {/* TABLEAU */}
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : filteredUsers.length === 0 ? (
            <p>Aucun utilisateur trouvé.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border bg-white rounded-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Photo</th>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Téléphone</th>
                    <th className="px-4 py-2">Rôle</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden border shadow-sm mx-auto">
                          <img
                            src={
                              u.photoUrl
                                ? `${API}${u.photoUrl}`
                                : "/default-avatar.png"
                            }
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-2">{u.username}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">{u.telephone || "—"}</td>
                      <td className="px-4 py-2">{u.role?.name || "—"}</td>

                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-white ${
                            u.status === "active" ? "bg-green-600" : "bg-gray-500"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="px-4 py-2 text-center flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUserForDetail(u);
                            setOpenDetail(true);
                          }}
                        >
                          <LucideEye className="w-4 h-4" />
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                          <LucideEdit className="w-4 h-4" />
                        </Button>

                        <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>
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

      {/* DETAILS MODAL */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails utilisateur</DialogTitle>
          </DialogHeader>

          {selectedUserForDetail && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border shadow-sm">
                  <img
                    src={
                      selectedUserForDetail.photoUrl
                        ? `${API}${selectedUserForDetail.photoUrl}`
                        : "/default-avatar.png"
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <p>
                <b>Nom :</b> {selectedUserForDetail.username}
              </p>
              <p>
                <b>Email :</b> {selectedUserForDetail.email}
              </p>
              <p>
                <b>Téléphone :</b> {selectedUserForDetail.telephone || "—"}
              </p>
              <p>
                <b>Rôle :</b> {selectedUserForDetail.role?.name || "—"}
              </p>
              <p>
                <b>Créé le :</b>{" "}
                {new Date(selectedUserForDetail.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FORM MODAL */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Modifier utilisateur" : "Ajouter utilisateur"}
            </DialogTitle>
          </DialogHeader>

          {/* Formulaire amélioré (layout en deux colonnes) */}
          <form onSubmit={submitForm} className="grid grid-cols-2 gap-4 pt-2">

            {/* ========= Colonne gauche ========= */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium">Nom d'utilisateur</label>
                <Input name="username" defaultValue={editingUser?.username || ""} required />
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <Input name="email" type="email" defaultValue={editingUser?.email || ""} required />
              </div>

              <div>
                <label className="block text-sm font-medium">Téléphone</label>
                <Input name="telephone" defaultValue={editingUser?.telephone || ""} />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium">Mot de passe</label>
                  <Input name="password" type="password" required />
                </div>
              )}

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium">Nouveau mot de passe</label>
                  <Input name="password" type="password" placeholder="Laisser vide pour ne pas modifier" />
                </div>
              )}
            </div>

            {/* ========= Colonne droite ========= */}
            <div className="flex flex-col gap-3">

              <div>
                <label className="block text-sm font-medium">Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />

                {/* Preview */}
                <div className="w-20 h-20 rounded-full overflow-hidden border mt-2">
                  <img
                    src={
                      photoFile
                        ? URL.createObjectURL(photoFile)
                        : editingUser?.photoUrl
                        ? `${API}${editingUser.photoUrl}`
                        : "/default-avatar.png"
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Rôle</label>
                <select
                  name="roleId"
                  defaultValue={editingUser?.role?.id ?? ""}
                  className="border rounded px-2 py-2 w-full"
                  required
                >
                  <option value="">-- Choisir un rôle --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Statut</label>
                <select
                  name="status"
                  defaultValue={editingUser?.status || "active"}
                  className="border rounded px-2 py-2 w-full"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Lier à un élève officier</label>
                <select
                  value={selectedStudentIdToLink}
                  onChange={(e) => setSelectedStudentIdToLink(e.target.value)}
                  className="border rounded px-2 py-2 w-full"
                >
                  <option value="">-- Ne pas lier --</option>
                  {studentsWithoutUser.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.matricule} — {s.nom} {s.prenom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Lier à un enseignant</label>
                <select
                  value={selectedTeacherIdToLink}
                  onChange={(e) => setSelectedTeacherIdToLink(e.target.value)}
                  className="border rounded px-2 py-2 w-full"
                >
                  <option value="">-- Ne pas lier --</option>
                  {teachersWithoutUser.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nom} {t.prenom} {t.grade ? `(${t.grade})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="col-span-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenForm(false);
                  setEditingUser(null);
                  setSelectedStudentIdToLink("");
                  setSelectedTeacherIdToLink("");
                }}
              >
                Annuler
              </Button>

              <Button type="submit" disabled={loading}>
                {editingUser ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
