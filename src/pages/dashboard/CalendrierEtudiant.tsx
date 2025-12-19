import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import api from "@/utils/axiosConfig";

export default function CalendrierEtudiant() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------
  // Charger les schedules de l'étudiant connecté
  // -------------------------------------------------
  const fetchStudentSchedules = async () => {
  try {
    const response = await api.get("/schedules/student/my");

    const schedules = Array.isArray(response.data) ? response.data : [];

    const mapped = schedules.map((s: any) => {
      const moduleName = s.module?.title ?? "";
      const teacherName = s.teacher
        ? `${s.teacher.nom} ${s.teacher.prenom}`
        : "";
      const promotionName = s.promotion?.nom ?? "";

      const titleParts = [
        s.title,
        moduleName,
        promotionName,
        teacherName,
      ].filter(Boolean);

      const color = s.color ?? "#0d6efd";

      return {
        id: s.id,
        title: titleParts.join(" — "),
        start: s.start,
        end: s.end,
        backgroundColor: color,
        borderColor: color,
        extendedProps: s,
      };
    });

    setEvents(mapped);
  } catch (error) {
    console.error("Erreur calendrier Académique :", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchStudentSchedules();
  }, []);

  // ---------------------------------------------
  // UI CALENDRIER
  // ---------------------------------------------
  if (loading)
    return (
      <div className="p-4 text-center text-gray-600">
        Chargement du calendrier…
      </div>
    );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Mon Calendrier Académique</h1>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        height="80vh"
        events={events}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
      />
    </div>
  );
}
