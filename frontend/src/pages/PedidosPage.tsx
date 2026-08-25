import { useState } from "react";
import { Link } from "react-router-dom";
import { usePedidos } from "../hooks/usePedidos";
import { Input, Select } from "../components/ui/Input";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";

const STATUS_CLASSES: Record<string, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

const ORIGEM_CLASSES: Record<string, string> = {
  site: "bg-indigo-100 text-indigo-700",
  manual: "bg-slate-100 text-slate-600",
};

export function PedidosPage() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [status, setStatus] = useState("");
  const [origem, setOrigem] = useState("");

  const { data: pedidos, isLoading, error } = usePedidos({
    de: de || undefined,
    ate: ate || undefined,
    status: status || undefined,
    origem: origem || undefined,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Pedidos</h1>
        <p className="text-sm text-slate-500">
          Todos os pedidos, do site e do balcão — inclusive os que ainda precisam de atenção
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Input label="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        <Input label="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
        </Select>
        <Select label="Origem" value={origem} onChange={(e) => setOrigem(e.target.value)}>
          <option value="">Todas</option>
          <option value="site">Site</option>
          <option value="manual">Manual</option>
        </Select>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Erro ao carregar pedidos" />}

      {pedidos && (
        <Table
          rows={pedidos}
          keyField={(row) => row.id}
          emptyMessage="Nenhum pedido encontrado para esse filtro"
          columns={[
            {
              header: "Data",
              render: (row) => (
                <Link to={`/admin/pedidos/${row.id}`} className="font-medium text-emerald-700 hover:underline">
                  {new Date(row.dataPedido).toLocaleString("pt-BR")}
                </Link>
              ),
            },
            { header: "Cliente", render: (row) => row.cliente?.nome ?? "—" },
            {
              header: "Origem",
              render: (row) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORIGEM_CLASSES[row.origem] ?? ""}`}>
                  {row.origem}
                </span>
              ),
            },
            {
              header: "Itens",
              render: (row) => row.itens.reduce((soma, item) => soma + item.quantidade, 0),
            },
            {
              header: "Entrega",
              render: (row) => (row.formaEntrega === "envio" ? "Envio" : row.formaEntrega === "retirada" ? "Retirada" : "—"),
            },
            {
              header: "Frete",
              render: (row) => (
                <span className="inline-flex items-center gap-2">
                  R$ {Number(row.valorFrete).toFixed(2)}
                  {row.freteAbonadoMotivo && (
                    <span
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                      title={row.freteAbonadoMotivo}
                    >
                      Abonado
                    </span>
                  )}
                </span>
              ),
            },
            { header: "Total", render: (row) => `R$ ${Number(row.valorTotal).toFixed(2)}` },
            {
              header: "Status",
              render: (row) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[row.status] ?? ""}`}>
                  {row.status}
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
