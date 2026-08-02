import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface ProdutoPublico {
  id: number;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  precoVenda: string;
}

export function useCatalogo() {
  return useQuery({
    queryKey: ["catalogo"],
    queryFn: () => api.get<ProdutoPublico[]>("/api/produtos"),
  });
}

export function useProdutoPublico(id: number | undefined) {
  return useQuery({
    queryKey: ["catalogo", id],
    queryFn: () => api.get<ProdutoPublico>(`/api/produtos/${id}`),
    enabled: id !== undefined,
  });
}
