import type { ModuleType } from "./module";
import type { TeacherType } from "./teacher";
import type { PromotionType } from "./promotion";

export interface ScheduleType {
  id: string;

  title: string;
  moduleId: string | null;
  teacherId: string | null;
  promotionId: number | null;

  start: string | Date;
  end: string | Date;

  room?: string | null;
  type?: string | null;
  color?: string | null;
  notes?: string | null;

  // 🔥 AJOUT DES RELATIONS — utilisé dans CalendrierAcademique
  module?: ModuleType | null;
  teacher?: TeacherType | null;
  promotion?: PromotionType | null;
}
