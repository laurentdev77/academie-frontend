import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, Edit3, Trash2 } from "lucide-react";
import api from "@/lib/axiosConfig";
import { Dialog } from "@/components/ui/dialog";

// 🔥 Interface recréée localement
interface Seance {
  id: string | number;
  titre?: string;
  date?: string;
  heureDebut?: string | null;
  heureFin?: string | null;
  moduleId?: string | number;
}

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
  setError
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Seance | null>(null);

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

    if (!selectedModule) return setError("Sélectionnez un module d'abord.");
    if (!titre || !date || !heureDebut) return setError("Remplissez les champs obligatoires.");

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
          moduleId: selectedModule
        });
        setInfo("Séance créée.");
      } else if (showEdit && editing) {
        closeAllModals();
        await new Promise((r) => setTimeout(r, 50));

        await api.patch(`/seances/${editing.id}`, {
          titre,
          date,
          heureDebut,
          heureFin: heureFin || null
        });

        setInfo("Séance modifiée.");
      }

      onRefreshSeances();
      closeAllModals();
    } catch (err: any) {
      console.error("Erreur création/modification séance:", err);
      setError(err?.response?.data?.message || err?.message || "Erreur lors de la création/modification.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteSeance(seanceId: string) {
    closeAllModals();
    await new Promise((r) => setTimeout(r, 60));

    if (!window.confirm("Voulez-vous vraiment supprimer cette séance ?")) return;

    setDeletingId(seanceId);
    setError(null);
    setInfo(null);

    try {
      await api.delete(`/seances/${seanceId}`);
      setInfo("Séance supprimée.");

      if (String(selectedSeance) === String(seanceId)) {
        setTimeout(() => onSelectSeance(""), 80);
      }

      onRefreshSeances();
    } catch (err: any) {
      console.error("Erreur suppression séance:", err);
      setError(err?.response?.data?.message || err?.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  const hasNoSeances = useMemo(() => !loadingSeances && safeSeances.length === 0, [loadingSeances, safeSeances]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Séances</CardTitle>
        <Button variant="ghost" size="sm" onClick={openCreateModal}>
          <PlusCircle className="mr-2" /> Créer
        </Button>
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
            <p className="text-sm text-muted-foreground">Créez-en une via le bouton.</p>
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

            {selectedSeance && (
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
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
