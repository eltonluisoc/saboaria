import { useState } from "react";
import { Link } from "react-router-dom";
import { useProdutos } from "../hooks/useProdutos";
import { useRegistrarVenda, useVendas } from "../hooks/useVendas";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

interface ItemCarrinho {
  produtoId: number;
  quantidade: number;
}

const FORMAS_PAGAMENTO = ["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito"];

const STATUS_CLASSES: Record<string, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

export function VendasPage() {
  const { data: produtos } = useProdutos();
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const { data: vendas, isLoading, error } = useVendas(de && ate ? { de, ate } : undefined);
  const registrarVenda = useRegistrarVenda();

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState("1");
  const [formaPagamento, setFormaPagamento] = useState(FORMAS_PAGAMENTO[0]);
  const [jaRecebeuPagamento, setJaRecebeuPagamento] = useState(true);
  const [nomeComprador, setNomeComprador] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

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

  async function registrarVendaHandler() {
    setFormError(null);
    setSucesso(false);
    try {
      await registrarVenda.mutateAsync({
        itens: carrinho.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        formaPagamento,
        status: jaRecebeuPagamento ? "pago" : "pendente",
        nomeComprador: nomeComprador.trim() || undefined,
      });
      setCarrinho([]);
      setNomeComprador("");
      setSucesso(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erro ao registrar venda");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Vendas manuais</h1>
        <p className="text-sm text-slate-500">Vendas feitas direto no balcão, fora do site</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-800">Registrar venda</h2>

        {formError && (
          <div className="mb-3">
            <ErrorBanner message={formError} />
          </div>
        )}
        {sucesso && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            Venda registrada com sucesso.
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-end gap-3">
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

        <div className="mb-4 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium">Quantidade</th>
                <th className="px-4 py-2 font-medium">Preço unitário</th>
                <th className="px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carrinho.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
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
                    <td className="px-4 py-2">R$ {Number(produto?.precoVenda ?? 0).toFixed(2)}</td>
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

        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="space-y-3">
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
              <input
                type="checkbox"
                checked={jaRecebeuPagamento}
                onChange={(e) => setJaRecebeuPagamento(e.target.checked)}
              />
              Já recebi o pagamento
            </label>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-800">R$ {total.toFixed(2)}</p>
          </div>
          <Button onClick={registrarVendaHandler} disabled={carrinho.length === 0 || registrarVenda.isPending}>
            {registrarVenda.isPending ? "Registrando..." : "Registrar venda"}
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-medium text-slate-800">Histórico de vendas</h2>
          <div className="flex items-end gap-3">
            <Input label="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            <Input label="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </div>
        {isLoading && <Spinner />}
        {error && <ErrorBanner message="Erro ao carregar vendas" />}
        {vendas && (
          <Table
            rows={vendas}
            keyField={(row) => row.id}
            columns={[
              {
                header: "Data",
                render: (row) => (
                  <Link to={`/admin/pedidos/${row.id}`} className="font-medium text-emerald-700 hover:underline">
                    {new Date(row.dataPedido).toLocaleString("pt-BR")}
                  </Link>
                ),
              },
              { header: "Comprador", render: (row) => row.nomeComprador ?? "—" },
              {
                header: "Itens",
                render: (row) => row.itens.reduce((soma, item) => soma + item.quantidade, 0),
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
      </div>
    </div>
  );
}
