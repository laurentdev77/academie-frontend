import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { TeacherModule } from "@/pages/dashboard/PresenceEnseignant";

interface Props {
  modules: TeacherModule[];
  loading: boolean;
  selectedModule: string;
  onSelect: (id: string) => void;
}

export default function ModuleSelector({ modules, loading, selectedModule, onSelect }: Props) {
  const safeModules = modules ?? [];

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin" />
        <span>Chargement des modules...</span>
      </div>
    );
  }

  if (safeModules.length === 0) {
    return (
      <div>
        <p>Aucun module attribué à votre compte.</p>
        <p className="text-sm text-muted-foreground">Contactez l'administrateur si nécessaire.</p>
      </div>
    );
  }

  return (
    <div style={{ minWidth: 320 }}>
      <Select value={selectedModule} onValueChange={(v) => onSelect(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un module" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {safeModules.map((m) => (
              <SelectItem key={String(m.id)} value={String(m.id)}>
                {m.title} — {m.code}
                {m.promotion ? ` (${m.promotion.nom})` : ""}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
