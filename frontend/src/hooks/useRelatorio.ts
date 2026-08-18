import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Alertas, ProdutoMaisVendido, Relatorio } from "../types";

export function useRelatorio(de: string, ate: string) {
  return useQuery({
    queryKey: ["relatorio", de, ate],
    queryFn: () => api.get<Relatorio>(`/api/admin/relatorio?de=${de}&ate=${ate}`),
    enabled: Boolean(de && ate),
  });
}

export function useProdutosMaisVendidos(de: string, ate: string) {
  return useQuery({
    queryKey: ["relatorio", "produtos-mais-vendidos", de, ate],
    queryFn: () => api.get<ProdutoMaisVendido[]>(`/api/admin/relatorio/produtos-mais-vendidos?de=${de}&ate=${ate}`),
    enabled: Boolean(de && ate),
  });
}

export function useAlertas() {
  return useQuery({
    queryKey: ["relatorio", "alertas"],
    queryFn: () => api.get<Alertas>("/api/admin/relatorio/alertas"),
  });
}
