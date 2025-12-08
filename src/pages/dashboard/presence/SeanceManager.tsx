import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, Edit3, Trash2 } from "lucide-react";
import api from "@/lib/axiosConfig";
import type { Seance, UUID } from "@/pages/dashboard/PresenceEnseignant";
import { Dialog } from "@/components/ui/dialog"; // use your project's Dialog; you provided a simple Dialog earlier

interface Props {
  modules: any[];
  seances: Seance[];
  loadingSeances: boolean;
  selectedModule: string;
  selectedSeance: string;
  onSelectSeance: (id: string) => void;
  onRefreshSeances: () => void;
  setInfo: (s: string | null) => void;
  setError: (s: string | null) => void;
}

export default function SeanceManager({
  seances,
  loadingSeances,
  selectedModule,
  selectedSeance,
  onSelectSeance,
  onRefreshSeances,
  setInfo,
  setError,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Seance | null>(null);

  // create form state
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const safeSeances = seances ?? [];

  const openCreateModal = () => {
    setTitre("");
    setDate("");
    setHeureDebut("");
    setHeureFin("");
    setShowCreate(true);
    setShowEdit(false);
  };

  const openEditModal = (s: Seance) => {
    setEditing(s);
    setTitre(s.titre ?? "");
    setDate(s.date ?? "");
    setHeureDebut(s.heureDebut ?? "");
    setHeureFin(s.heureFin ?? "");
    setShowEdit(true);
    setShowCreate(false);
  };

  const closeAllModals = () => {
    setShowCreate(false);
    setShowEdit(false);
    setEditing(null);
  };

  async function submitSeance(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedModule) {
      setError("Sélectionnez un module d'abord.");
      return;
    }
    if (!titre || !date || !heureDebut) {
      setError("Remplissez le titre, la date et l'heure de début.");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      if (showCreate) {
        await api.post("/seances", {
          titre,
          date,
          heureDebut,
          heureFin: heureFin || null,
          moduleId: selectedModule,
        });
        setInfo("Séance créée.");
      } else if (showEdit && editing) {
        // close modal first to avoid portal race
        closeAllModals();
        await new Promise((r) => setTimeout(r, 50));
        await api.patch(`/seances/${editing.id}`, {
          titre,
          date,
          heureDebut,
          heureFin: heureFin || null,
        });
        setInfo("Séance modifiée.");
      }
      // refresh seances
      onRefreshSeances();
      closeAllModals();
    } catch (err: any) {
      console.error("Erreur création/modif séance:", err);
      if (err?.response?.status === 401) setError("Non authentifié. Connectez-vous.");
      else setError(err?.response?.data?.message || err?.message || "Erreur lors de la création/modification.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteSeance(seanceId: string) {
    // close any open modal first (prevent portal race)
    closeAllModals();
    // small delay to allow portal to unmount properly
    await new Promise((r) => setTimeout(r, 60));

    if (!window.confirm("Voulez-vous vraiment supprimer cette séance ?")) return;

    setDeletingId(seanceId);
    setError(null);
    setInfo(null);
    try {
      await api.delete(`/seances/${seanceId}`);
      setInfo("Séance supprimée.");
      // if deleted was selected, clear selection after a small delay (avoid react unmount portal race)
      if (String(selectedSeance) === String(seanceId)) {
        setTimeout(() => onSelectSeance(""), 80);
      }
      onRefreshSeances();
    } catch (err: any) {
      console.error("Erreur suppression séance:", err);
      if (err?.response?.status === 401) setError("Non authentifié. Connectez-vous.");
      else setError(err?.response?.data?.message || err?.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  const hasNoSeances = useMemo(() => !loadingSeances && safeSeances.length === 0, [loadingSeances, safeSeances]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Séances</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={openCreateModal} title="Créer une séance">
            <PlusCircle className="mr-2" /> Créer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingSeances ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" />
            <span>Chargement des séances...</span>
          </div>
        ) : hasNoSeances ? (
          <div>
            <p>Aucune séance pour ce module.</p>
            <p className="text-sm text-muted-foreground">Créez-en une via "Créer".</p>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            <div style={{ minWidth: 320 }}>
              <Select value={selectedSeance} onValueChange={(v) => onSelectSeance(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une séance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {safeSeances.map((s) => (
                      <SelectItem key={String(s.id)} value={String(s.id)}>
                        {s.titre} — {s.date} {s.heureDebut ? `à ${s.heureDebut}` : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {selectedSeance ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const s = safeSeances.find((x) => String(x.id) === String(selectedSeance));
                    if (s) openEditModal(s);
                  }}
                >
                  <Edit3 className="mr-2" /> Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDeleteSeance(selectedSeance)}
                  disabled={!!deletingId}
                >
                  <Trash2 className="mr-2" /> {deletingId ? "Suppression..." : "Supprimer"}
                </Button>
              </>
            ) : null}
          </div>
        )}
      </CardContent>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={(o) => setShowCreate(o)}>
        <div className="w-full max-w-lg rounded bg-white p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Créer une séance</h3>
          <form onSubmit={submitSeance} className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium">Intitulé</label>
              <input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full rounded border px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded border px-2 py-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-sm font-medium">Heure début</label>
                <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="w-full rounded border px-2 py-1" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Heure fin</label>
                <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="w-full rounded border px-2 py-1" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin mr-2" /> : null}Créer
              </Button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEdit} onOpenChange={(o) => setShowEdit(o)}>
        <div className="w-full max-w-lg rounded bg-white p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Modifier la séance</h3>
          <form onSubmit={submitSeance} className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium">Intitulé</label>
              <input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full rounded border px-2 py-1" />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded border px-2 py-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-sm font-medium">Heure début</label>
                <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="w-full rounded border px-2 py-1" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Heure fin</label>
                <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="w-full rounded border px-2 py-1" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowEdit(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin mr-2" /> : null}Enregistrer
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </Card>
  );
}
