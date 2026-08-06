import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Produto, ProdutoDetalhado } from "../types";

export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: () => api.get<Produto[]>("/api/admin/produtos"),
  });
}

export function useProduto(id: number | undefined) {
  return useQuery({
    queryKey: ["produtos", id],
    queryFn: () => api.get<ProdutoDetalhado>(`/api/admin/produtos/${id}`),
    enabled: id !== undefined,
  });
}

export interface ProdutoInput {
  nome: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  precoVenda: number;
  pesoUnidadeGramas?: number | null;
  ativo?: boolean;
}

export function useCriarProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProdutoInput) => api.post<Produto>("/api/admin/produtos", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produtos"] }),
  });
}

export function useEditarProduto(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProdutoInput>) => api.put<Produto>(`/api/admin/produtos/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produtos"] }),
  });
}

export function useRemoverProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/produtos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produtos"] }),
  });
}

export interface ReceitaItemInput {
  insumoId: number;
  quantidadeUsada: number;
}

export function useSalvarReceita(produtoId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itens: ReceitaItemInput[]) =>
      api.put<ProdutoDetalhado>(`/api/admin/produtos/${produtoId}/receita`, itens),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produtos"] }),
  });
}
