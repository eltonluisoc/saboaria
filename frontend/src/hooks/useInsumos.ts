import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { CompraInsumo, Insumo } from "../types";

export function useInsumos() {
  return useQuery({
    queryKey: ["insumos"],
    queryFn: () => api.get<Insumo[]>("/api/admin/insumos"),
  });
}

export function useInsumo(id: number | undefined) {
  return useQuery({
    queryKey: ["insumos", id],
    queryFn: () => api.get<Insumo>(`/api/admin/insumos/${id}`),
    enabled: id !== undefined,
  });
}

export function useComprasInsumo(insumoId: number | undefined) {
  return useQuery({
    queryKey: ["insumos", insumoId, "compras"],
    queryFn: () => api.get<CompraInsumo[]>(`/api/admin/insumos/${insumoId}/compras`),
    enabled: insumoId !== undefined,
  });
}

export interface InsumoInput {
  nome: string;
  unidadeMedida: string;
  quantidadeInicial?: number;
  precoUnitarioInicial?: number;
}

export function useCriarInsumo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsumoInput) => api.post<Insumo>("/api/admin/insumos", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insumos"] }),
  });
}

export function useEditarInsumo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsumoInput) => api.put<Insumo>(`/api/admin/insumos/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insumos"] }),
  });
}

export function useRemoverInsumo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/insumos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insumos"] }),
  });
}

export interface CompraInput {
  quantidade: number;
  precoUnitario: number;
  dataCompra: string;
}

export function useRegistrarCompra(insumoId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompraInput) => api.post(`/api/admin/insumos/${insumoId}/compras`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insumos"] });
      qc.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}
