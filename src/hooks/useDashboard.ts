// src/hooks/useDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/dashboardService";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60, // 1 min
  });
};
