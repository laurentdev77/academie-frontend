// src/services/dashboardService.ts
import axios from "axios";

export const getDashboardStats = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get("http://localhost:5000/api/dashboard/stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
