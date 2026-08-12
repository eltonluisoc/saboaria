import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePedido, useCancelarPedido } from "../hooks/usePedidos";
import { Button } from "../components/ui/Button";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { Table } from "../components/ui/Table";
import { ApiError } from "../lib/api";

const STATUS_CLASSES: Record<string, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

export function PedidoDetailPage() {
  const { id } = useParams();
  const pedidoId = Number(id);
  const { data: pedido, isLoading, error } = usePedido(pedidoId);
  const cancelarPedido = useCancelarPedido();
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
          {pedido.status === "pendente" && (
            <Button
              type="button"
              variant="danger"
              className="ml-auto"
              onClick={handleCancelar}
              disabled={cancelarPedido.isPending}
            >
              {cancelarPedido.isPending ? "Cancelando..." : "Cancelar pedido"}
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
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
          <span className="text-lg font-semibold text-slate-800">
            Total: R$ {Number(pedido.valorTotal).toFixed(2)}
          </span>
        </div>
      </div>

      {pedido.mpPaymentId && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-medium text-slate-800">Mercado Pago</h2>
          <p className="text-sm text-slate-600">ID do pagamento: {pedido.mpPaymentId}</p>
        </div>
      )}
    </div>
  );
}
