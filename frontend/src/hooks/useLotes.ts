import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { LoteProducao } from "../types";

interface FiltrosLotes {
  produtoId?: number;
  de?: string;
  ate?: string;
}

function montarQuery(filtros?: FiltrosLotes) {
  if (!filtros) return "";
  const params = new URLSearchParams();
  if (filtros.produtoId !== undefined) params.set("produtoId", String(filtros.produtoId));
  if (filtros.de && filtros.ate) {
    params.set("de", filtros.de);
    params.set("ate", filtros.ate);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useLotes(filtros?: FiltrosLotes) {
  return useQuery({
    queryKey: ["lotes", filtros],
    queryFn: () => api.get<LoteProducao[]>(`/api/admin/lotes${montarQuery(filtros)}`),
  });
}

export interface LoteInput {
  produtoId: number;
  quantidadeProduzida: number;
  dataProducao: string;
}

export function useCriarLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoteInput) => api.post<LoteProducao>("/api/admin/lotes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lotes"] });
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["insumos"] });
    },
  });
}
