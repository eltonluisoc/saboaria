import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DespesaGeral } from "../types";

interface Periodo {
  de?: string;
  ate?: string;
}

export function useDespesas(periodo?: Periodo) {
  const params = periodo?.de && periodo?.ate ? `?de=${periodo.de}&ate=${periodo.ate}` : "";
  return useQuery({
    queryKey: ["despesas", periodo],
    queryFn: () => api.get<DespesaGeral[]>(`/api/admin/despesas${params}`),
  });
}

export interface DespesaInput {
  descricao: string;
  valor: number;
  categoria?: string | null;
  dataDespesa: string;
  recorrente?: boolean;
  dataFimRecorrencia?: string | null;
  dataVencimento?: string | null;
}

export function useCriarDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DespesaInput) => api.post<DespesaGeral>("/api/admin/despesas", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

export function useEditarDespesa(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DespesaInput>) => api.put<DespesaGeral>(`/api/admin/despesas/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

export function useRemoverDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/despesas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

export function useMarcarDespesaPaga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<DespesaGeral>(`/api/admin/despesas/${id}/marcar-paga`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["despesas"] });
      qc.invalidateQueries({ queryKey: ["relatorio"] });
    },
  });
}

export function useMarcarDespesaEmAberto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<DespesaGeral>(`/api/admin/despesas/${id}/marcar-em-aberto`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["despesas"] });
      qc.invalidateQueries({ queryKey: ["relatorio"] });
    },
  });
}
