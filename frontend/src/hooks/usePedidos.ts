import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Venda as Pedido } from "../types";

interface FiltrosPedidos {
  de?: string;
  ate?: string;
  status?: string;
  origem?: string;
}

function montarQuery(filtros?: FiltrosPedidos) {
  if (!filtros) return "";
  const params = new URLSearchParams();
  if (filtros.de && filtros.ate) {
    params.set("de", filtros.de);
    params.set("ate", filtros.ate);
  }
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.origem) params.set("origem", filtros.origem);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function usePedidos(filtros?: FiltrosPedidos) {
  return useQuery({
    queryKey: ["pedidos", filtros],
    queryFn: () => api.get<Pedido[]>(`/api/admin/pedidos${montarQuery(filtros)}`),
  });
}

export function usePedido(id: number | undefined) {
  return useQuery({
    queryKey: ["pedidos", id],
    queryFn: () => api.get<Pedido>(`/api/admin/pedidos/${id}`),
    enabled: id !== undefined,
  });
}

export function useCancelarPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Pedido>(`/api/admin/pedidos/${id}/cancelar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
  });
}

export function useAtualizarRastreio(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (codigoRastreio: string) =>
      api.put<Pedido>(`/api/admin/pedidos/${id}/rastreio`, { codigoRastreio }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
  });
}

export function useAvancarStatusPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Pedido>(`/api/admin/pedidos/${id}/avancar-status`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
  });
}
