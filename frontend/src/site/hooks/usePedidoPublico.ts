import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { PedidoPublico } from "../../types";

export function usePedidoPublico(codigoAcesso: string | undefined) {
  return useQuery({
    queryKey: ["pedido-publico", codigoAcesso],
    queryFn: () => api.get<PedidoPublico>(`/api/pedidos-publico/${codigoAcesso}`),
    enabled: Boolean(codigoAcesso),
    retry: false,
  });
}
