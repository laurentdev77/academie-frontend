import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";

type FetchOptions<T> = {
  enabled?: boolean;
  staleTime?: number;
};

export function useFetch<T = any>(
  endpoint: string,
  options?: FetchOptions<T>
) {
  return useQuery<T, Error>({
    queryKey: [endpoint], // 🔹 Toujours un tableau
    queryFn: async ({ queryKey }: QueryFunctionContext) => {
      const [key] = queryKey;
      const res = await fetch(`http://localhost:5000/${key}`);
      if (!res.ok) throw new Error(`Erreur fetch ${key}: ${res.statusText}`);
      return res.json() as Promise<T>;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
  });
}
