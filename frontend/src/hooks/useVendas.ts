import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Venda } from "../types";

export interface VendaItemInput {
  produtoId: number;
  quantidade: number;
}

export interface VendaInput {
  itens: VendaItemInput[];
  formaPagamento?: string;
  status?: string;
  nomeComprador?: string;
}

export function useRegistrarVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VendaInput) => api.post<Venda>("/api/admin/vendas", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
  });
}
