import { useState } from "react";
import { Link } from "react-router-dom";
import { usePedidos } from "../hooks/usePedidos";
import { useProdutos } from "../hooks/useProdutos";
import { useRegistrarVenda } from "../hooks/useVendas";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

const STATUS_CLASSES: Record<string, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

const ORIGEM_CLASSES: Record<string, string> = {
  site: "bg-indigo-100 text-indigo-700",
  manual: "bg-slate-100 text-slate-600",
};

type OrigemFiltro = "" | "site" | "manual";

export function PedidosPage() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [status, setStatus] = useState("");
  const [origem, setOrigem] = useState<OrigemFiltro>("");
  const [modalAberto, setModalAberto] = useState(false);

  const { data: pedidos, isLoading, error } = usePedidos({
    de: de || undefined,
    ate: ate || undefined,
    status: status || undefined,
    origem: origem || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Pedidos</h1>
          <p className="text-sm text-slate-500">
            Todos os pedidos, do site e do balcão — inclusive os que ainda precisam de atenção
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>Registrar venda</Button>
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
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "", label: "Todos" },
            { key: "site", label: "Site" },
            { key: "manual", label: "Balcão" },
          ] as { key: OrigemFiltro; label: string }[]
        ).map((opcao) => (
          <button
            key={opcao.key || "todos"}
            onClick={() => setOrigem(opcao.key)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              origem === opcao.key
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {opcao.label}
          </button>
        ))}
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
            { header: "Cliente", render: (row) => row.cliente?.nome ?? row.nomeComprador ?? "—" },
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
            { header: "Forma de pagamento", render: (row) => row.formaPagamento ?? "—" },
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

      {modalAberto && <RegistrarVendaModal onClose={() => setModalAberto(false)} />}
    </div>
  );
}

interface ItemCarrinho {
  produtoId: number;
  quantidade: number;
}

const FORMAS_PAGAMENTO = ["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito"];

function RegistrarVendaModal({ onClose }: { onClose: () => void }) {
  const { data: produtos } = useProdutos();
  const registrarVenda = useRegistrarVenda();

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState("1");
  const [formaPagamento, setFormaPagamento] = useState(FORMAS_PAGAMENTO[0]);
  const [jaRecebeuPagamento, setJaRecebeuPagamento] = useState(true);
  const [nomeComprador, setNomeComprador] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const produtosPorId = new Map((produtos ?? []).map((p) => [p.id, p]));

  function adicionarAoCarrinho() {
    if (!produtoSelecionado || !quantidadeSelecionada) return;
    const produtoId = Number(produtoSelecionado);
    if (carrinho.some((i) => i.produtoId === produtoId)) {
      setFormError("Esse produto ja esta no carrinho — remova e adicione de novo com a quantidade certa");
      return;
    }
    setCarrinho([...carrinho, { produtoId, quantidade: Number(quantidadeSelecionada) }]);
    setProdutoSelecionado("");
    setQuantidadeSelecionada("1");
    setFormError(null);
  }

  function removerDoCarrinho(produtoId: number) {
    setCarrinho(carrinho.filter((i) => i.produtoId !== produtoId));
  }

  const total = carrinho.reduce((soma, item) => {
    const produto = produtosPorId.get(item.produtoId);
    return soma + (produto ? Number(produto.precoVenda) * item.quantidade : 0);
  }, 0);

  async function handleRegistrar() {
    setFormError(null);
    try {
      await registrarVenda.mutateAsync({
        itens: carrinho.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        formaPagamento,
        status: jaRecebeuPagamento ? "pago" : "pendente",
        nomeComprador: nomeComprador.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erro ao registrar venda");
    }
  }

  return (
    <Modal title="Registrar venda" onClose={onClose}>
      <div className="space-y-4">
        {formError && <ErrorBanner message={formError} />}

        <div className="flex flex-wrap items-end gap-3">
          <Select label="Produto" value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)}>
            <option value="">Selecione...</option>
            {(produtos ?? [])
              .filter((p) => !carrinho.some((i) => i.produtoId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — R$ {Number(p.precoVenda).toFixed(2)}
                </option>
              ))}
          </Select>
          <Input
            label="Quantidade"
            type="number"
            min="1"
            step="1"
            value={quantidadeSelecionada}
            onChange={(e) => setQuantidadeSelecionada(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={adicionarAoCarrinho}>
            Adicionar
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium">Quantidade</th>
                <th className="px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carrinho.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Nenhum produto adicionado
                  </td>
                </tr>
              )}
              {carrinho.map((item) => {
                const produto = produtosPorId.get(item.produtoId);
                const subtotal = produto ? Number(produto.precoVenda) * item.quantidade : 0;
                return (
                  <tr key={item.produtoId}>
                    <td className="px-4 py-2">{produto?.nome ?? `#${item.produtoId}`}</td>
                    <td className="px-4 py-2">{item.quantidade}</td>
                    <td className="px-4 py-2">R$ {subtotal.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button className="text-red-600 hover:underline" onClick={() => removerDoCarrinho(item.produtoId)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Input
          label="Nome do comprador (opcional)"
          value={nomeComprador}
          onChange={(e) => setNomeComprador(e.target.value)}
        />
        <Select label="Forma de pagamento" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
          {FORMAS_PAGAMENTO.map((forma) => (
            <option key={forma} value={forma}>
              {forma}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={jaRecebeuPagamento} onChange={(e) => setJaRecebeuPagamento(e.target.checked)} />
          Já recebi o pagamento
        </label>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-800">R$ {total.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrar} disabled={carrinho.length === 0 || registrarVenda.isPending}>
              {registrarVenda.isPending ? "Registrando..." : "Registrar venda"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
