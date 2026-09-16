import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DespesaGeral } from "../types";

export interface ProLaboreResponse {
  configurado: boolean;
  id?: number;
  valor?: string;
  diaPagamento?: number;
  parcelas?: DespesaGeral[];
}

export function useProLabore() {
  return useQuery({
    queryKey: ["pro-labore"],
    queryFn: () => api.get<ProLaboreResponse>("/api/admin/pro-labore"),
  });
}

function invalidarTudo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["pro-labore"] });
  qc.invalidateQueries({ queryKey: ["despesas"] });
  qc.invalidateQueries({ queryKey: ["relatorio"] });
}

export function useConfigurarProLabore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { valor: number; diaPagamento: number }) =>
      api.post<ProLaboreResponse>("/api/admin/pro-labore", data),
    onSuccess: () => invalidarTudo(qc),
  });
}

export function useAtualizarValorProLabore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { valor: number }) => api.put<ProLaboreResponse>("/api/admin/pro-labore", data),
    onSuccess: () => invalidarTudo(qc),
  });
}
