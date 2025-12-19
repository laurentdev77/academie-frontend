// src/hooks/useFetch.ts
import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";

/* -----------------------------------------------------------
   Types
----------------------------------------------------------- */
type FetchOptions<T> = {
  enabled?: boolean;
  staleTime?: number;
};

/* -----------------------------------------------------------
   Hook générique de fetch
----------------------------------------------------------- */
export function useFetch<T = any>(
  endpoint: string,
  options?: FetchOptions<T>
) {
  const API_URL = import.meta.env.VITE_API_URL;

  return useQuery<T, Error>({
    queryKey: [endpoint],
    queryFn: async ({ queryKey }: QueryFunctionContext) => {
      const [key] = queryKey as [string];

      const res = await fetch(`${API_URL}/${key}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token")
            ? `Bearer ${localStorage.getItem("token")}`
            : "",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Erreur fetch ${key}`);
      }

      return res.json() as Promise<T>;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 0,
  });
}
