export interface ModuleType {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  credits?: number | null;
  semester?: number | null;
  coefficient?: number | null;
  isOptional?: boolean | null;

  teacherId?: string | null;
  promotionId?: number | null;
  filiereId?: number | null;

  // 🔥 AJOUT OBLIGATOIRE POUR SUPPRIMER TES ERREURS
  color?: string | null;

  // Relations
  teacher?: {
    id: string;
    username: string;
    email?: string;
  } | null;

  promotion?: {
    id: number;
    nom: string;
  } | null;
}
