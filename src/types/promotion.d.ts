export interface PromotionType {
  id: number;
  nom: string;

  filiere?: {
    id: number;
    nom: string;
  } | null;
}
