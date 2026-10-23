import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface InterpretarVendaResultado {
  itens: { produtoId: number; quantidade: number }[];
  nomeComprador: string | null;
  formaPagamento: string | null;
  status: "pago" | "pendente";
  avisos: string[];
}

export function useInterpretarVenda() {
  return useMutation({
    mutationFn: (texto: string) =>
      api.post<InterpretarVendaResultado>("/api/admin/ia/interpretar-venda", { texto }),
  });
}
