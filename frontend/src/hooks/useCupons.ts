import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface Cupom {
  id: number;
  codigo: string;
  percentualDesconto: string;
  ativo: boolean;
  validoAte: string | null;
  usoMaximo: number | null;
  vezesUsado: number;
  createdAt: string;
}

export interface CupomInput {
  codigo: string;
  percentualDesconto: number;
  validoAte?: string | null;
  usoMaximo?: number | null;
}

export function useCupons() {
  return useQuery({
    queryKey: ["cupons"],
    queryFn: () => api.get<Cupom[]>("/api/admin/cupons"),
  });
}

export function useCriarCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CupomInput) => api.post<Cupom>("/api/admin/cupons", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cupons"] }),
  });
}

export function useEditarCupom(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CupomInput>) => api.put<Cupom>(`/api/admin/cupons/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cupons"] }),
  });
}

export function useAlternarAtivoCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Cupom>(`/api/admin/cupons/${id}/alternar-ativo`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cupons"] }),
  });
}
