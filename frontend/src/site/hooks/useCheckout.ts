import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface ClienteInput {
  nome: string;
  email: string;
  telefone?: string;
  endereco: string;
}

export interface CheckoutItemInput {
  produtoId: number;
  quantidade: number;
}

interface CheckoutResponse {
  pedidoId: number;
  checkoutUrl: string;
}

export function useCriarCheckout() {
  return useMutation({
    mutationFn: (data: { itens: CheckoutItemInput[]; cliente: ClienteInput }) =>
      api.post<CheckoutResponse>("/api/checkout", data),
  });
}

export interface StatusPedido {
  id: number;
  status: string;
}

export function useConfirmarPagamento() {
  return useMutation({
    mutationFn: (paymentId: string) => api.post<StatusPedido>("/api/checkout/confirmar", { paymentId }),
  });
}

export async function buscarStatusPedido(pedidoId: number) {
  return api.get<StatusPedido>(`/api/checkout/${pedidoId}/status`);
}
