export interface TeacherType {
  id: string;
  username: string;
  email?: string;
  roleId?: number;

  // Pour compatibilité totale
  nom?: string;
  prenom?: string;
}
