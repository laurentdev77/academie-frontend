// src/services/schedule.service.ts
import axios from "axios";

const API = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export type SchedulePayload = {
  id?: string;
  title: string;
  moduleId?: string | null;
  teacherId?: string | null;
  promotionId?: string | null;
  room?: string | null;
  type?: string | null; // TD/TP/Magistral
  start: string; // ISO string
  end: string; // ISO string
  color?: string | null;
  notes?: string | null;
};

export default {
  async list(params?: Record<string, any>) {
    const res = await axios.get(`${API}/api/schedules`, { headers: getHeaders(), params });
    // backend may return array or { data: [...] }
    return Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.schedules ?? [];
  },

  async get(id: string) {
    const res = await axios.get(`${API}/api/schedules/${id}`, { headers: getHeaders() });
    return res.data;
  },

  async create(payload: SchedulePayload) {
    const res = await axios.post(`${API}/api/schedules`, payload, { headers: getHeaders() });
    return res.data;
  },

  async update(id: string, payload: SchedulePayload) {
    const res = await axios.put(`${API}/api/schedules/${id}`, payload, { headers: getHeaders() });
    return res.data;
  },

  async remove(id: string) {
    const res = await axios.delete(`${API}/api/schedules/${id}`, { headers: getHeaders() });
    return res.data;
  },

  // helper endpoints to fetch related data for filters
  async teachers() {
    const res = await axios.get(`${API}/api/teachers/all`, { headers: getHeaders() });
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  },

  async modules() {
    const res = await axios.get(`${API}/api/modules`, { headers: getHeaders() });
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  },

  async promotions() {
    const res = await axios.get(`${API}/api/promotions`, { headers: getHeaders() });
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  },
};
