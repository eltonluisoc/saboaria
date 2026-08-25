import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  usePedido,
  useCancelarPedido,
  useAtualizarRastreio,
  useAvancarStatusPedido,
  useMarcarComoRecebido,
} from "../hooks/usePedidos";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { Table } from "../components/ui/Table";
import { ApiError } from "../lib/api";

const STATUS_CLASSES: Record<string, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  enviado: "bg-indigo-100 text-indigo-700",
  concluido: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

const PROXIMO_STATUS: Record<string, string> = {
  pago: "enviado",
  enviado: "concluído",
};

export function PedidoDetailPage() {
  const { id } = useParams();
  const pedidoId = Number(id);
  const { data: pedido, isLoading, error } = usePedido(pedidoId);
  const cancelarPedido = useCancelarPedido();
  const avancarStatus = useAvancarStatusPedido();
  const marcarComoRecebido = useMarcarComoRecebido();
  const atualizarRastreio = useAtualizarRastreio(pedidoId);
  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCancelar() {
    if (!confirm("Cancelar esse pedido? Essa ação não pode ser desfeita.")) return;
    setActionError(null);
    try {
      await cancelarPedido.mutateAsync(pedidoId);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao cancelar pedido");
    }
  }

  async function handleAvancarStatus() {
    setActionError(null);
    try {
      await avancarStatus.mutateAsync(pedidoId);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao avançar status");
    }
  }

  async function handleMarcarComoRecebido() {
    setActionError(null);
    try {
      await marcarComoRecebido.mutateAsync(pedidoId);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao marcar como recebido");
    }
  }

  async function handleSalvarRastreio(e: FormEvent) {
    e.preventDefault();
    if (!codigoRastreio.trim()) return;
    setActionError(null);
    try {
      await atualizarRastreio.mutateAsync(codigoRastreio.trim());
      setCodigoRastreio("");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao salvar código de rastreio");
    }
  }

  if (isLoading) return <Spinner />;
  if (error || !pedido) return <ErrorBanner message="Pedido não encontrado" />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/pedidos" className="text-sm text-emerald-700 hover:underline">
          &larr; Voltar para pedidos
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-800">Pedido #{pedido.id}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[pedido.status] ?? ""}`}
          >
            {pedido.status}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {pedido.origem}
          </span>
          {pedido.status === "pendente" && pedido.origem === "manual" && (
            <Button
              type="button"
              variant="secondary"
              className="ml-auto"
              onClick={handleMarcarComoRecebido}
              disabled={marcarComoRecebido.isPending}
            >
              {marcarComoRecebido.isPending ? "Marcando..." : "Marcar como recebido"}
            </Button>
          )}
          {pedido.status === "pendente" && (
            <Button
              type="button"
              variant="danger"
              className={pedido.origem === "manual" ? "" : "ml-auto"}
              onClick={handleCancelar}
              disabled={cancelarPedido.isPending}
            >
              {cancelarPedido.isPending ? "Cancelando..." : "Cancelar pedido"}
            </Button>
          )}
          {PROXIMO_STATUS[pedido.status] && (
            <Button
              type="button"
              variant="secondary"
              className="ml-auto"
              onClick={handleAvancarStatus}
              disabled={avancarStatus.isPending}
            >
              {avancarStatus.isPending
                ? "Avançando..."
                : `Marcar como ${PROXIMO_STATUS[pedido.status]}`}
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {new Date(pedido.dataPedido).toLocaleString("pt-BR")} · Forma de pagamento:{" "}
          {pedido.formaPagamento ?? "—"}
        </p>
        {actionError && (
          <div className="mt-2">
            <ErrorBanner message={actionError} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-800">Cliente</h2>
        {pedido.cliente ? (
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Nome</dt>
              <dd className="text-slate-800">{pedido.cliente.nome}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-800">{pedido.cliente.email}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-slate-500">Sem cliente vinculado (venda avulsa)</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-800">Itens</h2>
        <Table
          rows={pedido.itens}
          keyField={(row) => row.id}
          columns={[
            { header: "Produto", render: (row) => row.produto?.nome ?? `#${row.produtoId}` },
            { header: "Quantidade", render: (row) => row.quantidade },
            { header: "Preço unitário", render: (row) => `R$ ${Number(row.precoUnitario).toFixed(2)}` },
            { header: "Subtotal", render: (row) => `R$ ${Number(row.subtotal).toFixed(2)}` },
          ]}
        />
        <div className="mt-4 flex flex-col items-end gap-1 border-t border-slate-100 pt-4">
          {pedido.formaEntrega && (
            <span className="text-sm text-slate-500">
              Forma de entrega: {pedido.formaEntrega === "envio" ? "Envio" : "Retirada / combinada"}
            </span>
          )}
          <span className="text-sm text-slate-500">Frete: R$ {Number(pedido.valorFrete).toFixed(2)}</span>
          <span className="text-lg font-semibold text-slate-800">
            Total: R$ {Number(pedido.valorTotal).toFixed(2)}
          </span>
        </div>
      </div>

      {(pedido.status === "pago" || pedido.status === "enviado" || pedido.status === "concluido") && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-slate-800">Rastreio</h2>
          {pedido.codigoRastreio ? (
            <p className="mb-3 text-sm text-slate-600">
              Código: <span className="font-medium text-slate-800">{pedido.codigoRastreio}</span>
              {pedido.statusRastreioAtual && (
                <>
                  {" "}
                  · Último status: <span className="text-slate-800">{pedido.statusRastreioAtual}</span>
                </>
              )}
            </p>
          ) : (
            <p className="mb-3 text-sm text-slate-500">Nenhum código de rastreio registrado ainda.</p>
          )}
          <form onSubmit={handleSalvarRastreio} className="flex flex-wrap items-end gap-3">
            <Input
              label={pedido.codigoRastreio ? "Atualizar código de rastreio" : "Código de rastreio"}
              value={codigoRastreio}
              onChange={(e) => setCodigoRastreio(e.target.value)}
              placeholder="ex: BR123456789BR"
            />
            <Button type="submit" variant="secondary" disabled={atualizarRastreio.isPending}>
              {atualizarRastreio.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </div>
      )}

      {pedido.mpPaymentId && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-medium text-slate-800">Mercado Pago</h2>
          <p className="text-sm text-slate-600">ID do pagamento: {pedido.mpPaymentId}</p>
        </div>
      )}
    </div>
  );
}
