import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Relatorio } from "../types";

export function useRelatorio(de: string, ate: string) {
  return useQuery({
    queryKey: ["relatorio", de, ate],
    queryFn: () => api.get<Relatorio>(`/api/admin/relatorio?de=${de}&ate=${ate}`),
    enabled: Boolean(de && ate),
  });
}
