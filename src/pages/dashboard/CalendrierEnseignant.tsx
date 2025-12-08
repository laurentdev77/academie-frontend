// src/pages/enseignant/CalendrierEnseignant.tsx

import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import axios from "axios";

export default function CalendrierEnseignant() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------
  // Charger les schedules du professeur connecté
  // -------------------------------------------------
  const fetchMySchedules = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("Aucun token trouvé : enseignant non connecté.");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/schedules/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const schedules = Array.isArray(response.data) ? response.data : [];

      // Transformer les schedules en events compatibles FullCalendar
      const mapped = schedules.map((s: any) => {
        const moduleName = s.module?.title ?? "";
        const promotionName = s.promotion?.nom ?? "";
        const teacherFullName = s.teacher
          ? `${s.teacher.nom} ${s.teacher.prenom}`
          : "";

        const titleParts = [s.title, moduleName, promotionName, teacherFullName]
          .filter((x) => x && x.trim() !== "");

        const color = s.color ?? "#0066ff";

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
      console.error("Erreur calendrier enseignant :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySchedules();
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
      <h1 className="text-xl font-bold mb-4">Mon Calendrier</h1>

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
