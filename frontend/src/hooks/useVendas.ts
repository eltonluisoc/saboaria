import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Venda } from "../types";

interface Periodo {
  de?: string;
  ate?: string;
}

export function useVendas(periodo?: Periodo) {
  const params = periodo?.de && periodo?.ate ? `?de=${periodo.de}&ate=${periodo.ate}` : "";
  return useQuery({
    queryKey: ["vendas", periodo],
    queryFn: () => api.get<Venda[]>(`/api/admin/vendas${params}`),
  });
}

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendas"] }),
  });
}
