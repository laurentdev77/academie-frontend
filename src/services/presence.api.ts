// services/presence.api.ts
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Génère des headers sûrs pour fetch
const getHeaders = (token?: string): Record<string, string> => {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const presenceAPI = {
  upsertPresence: async (payload: any, token?: string) => {
    const headers = getHeaders(token);
    const res = await fetch(`${API_URL}/presence`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur upsertPresence: ${res.status}`);
    return await res.json();
  },

  fetchPresencesByModule: async (moduleId: string) => {
    const res = await fetch(`${API_URL}/presence/by-module/${moduleId}`, {
      headers: getHeaders(),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur fetchPresencesByModule: ${res.status}`);
    return await res.json();
  },

  fetchPresencesBySeance: async (seanceId: string) => {
    const res = await fetch(`${API_URL}/presence/by-seance/${seanceId}`, {
      headers: getHeaders(),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur fetchPresencesBySeance: ${res.status}`);
    return await res.json();
  },

  fetchSeances: async (moduleId: string) => {
    const res = await fetch(`${API_URL}/seances/by-module/${moduleId}`, {
      headers: getHeaders(),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur fetchSeances: ${res.status}`);
    return await res.json();
  },

  createSeance: async (payload: { moduleId: string; dateSeance: string; title?: string }) => {
    const res = await fetch(`${API_URL}/seances`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur createSeance: ${res.status}`);
    return await res.json();
  },

  updateSeance: async (id: string, payload: { dateSeance?: string; title?: string }) => {
    const res = await fetch(`${API_URL}/seances/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur updateSeance: ${res.status}`);
    return await res.json();
  },

  deleteSeance: async (id: string) => {
    const res = await fetch(`${API_URL}/seances/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur deleteSeance: ${res.status}`);
    return await res.json();
  },

  studentHistory: async (studentId: string) => {
    const res = await fetch(`${API_URL}/presence/history/${studentId}`, {
      headers: getHeaders(),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur studentHistory: ${res.status}`);
    return await res.json();
  },

  statsByModule: async (moduleId: string) => {
    const res = await fetch(`${API_URL}/presence/stats/${moduleId}`, {
      headers: getHeaders(),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erreur statsByModule: ${res.status}`);
    return await res.json();
  },
};

