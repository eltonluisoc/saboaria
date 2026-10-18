import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProduto, useProdutos, useSalvarReceita, useSalvarComposicaoKit } from "../hooks/useProdutos";
import { useInsumos } from "../hooks/useInsumos";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

interface ReceitaLinha {
  insumoId: number;
  quantidadeUsada: string;
  porUnidade: boolean;
}

interface KitLinha {
  produtoId: number;
  quantidade: string;
}

export function ProdutoDetailPage() {
  const { id } = useParams();
  const produtoId = Number(id);
  const { data: produto, isLoading } = useProduto(produtoId);
  const { data: insumos } = useInsumos();
  const { data: produtos } = useProdutos();
  const salvarReceita = useSalvarReceita(produtoId);
  const salvarKit = useSalvarComposicaoKit(produtoId);

  const [linhas, setLinhas] = useState<ReceitaLinha[]>([]);
  const [novoInsumoId, setNovoInsumoId] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novoPorUnidade, setNovoPorUnidade] = useState(false);
  const [itensKit, setItensKit] = useState<KitLinha[]>([]);
  const [novoProdutoKitId, setNovoProdutoKitId] = useState("");
  const [novaQuantidadeKit, setNovaQuantidadeKit] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (produto) {
      setLinhas(
        produto.receita.map((item) => ({
          insumoId: item.insumoId,
          quantidadeUsada: item.quantidadeUsada,
          porUnidade: item.porUnidade,
        }))
      );
      setItensKit(
        produto.composicaoKit.map((item) => ({
          produtoId: item.produtoId,
          quantidade: String(item.quantidade),
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto?.id]);

  const insumosPorId = new Map((insumos ?? []).map((i) => [i.id, i]));
  const produtosPorId = new Map((produtos ?? []).map((p) => [p.id, p]));
  const produtosDisponiveisParaKit = (produtos ?? []).filter((p) => !p.ehKit && p.id !== produtoId);

  function adicionarLinha() {
    if (!novoInsumoId || !novaQuantidade) return;
    const insumoId = Number(novoInsumoId);
    if (linhas.some((l) => l.insumoId === insumoId)) {
      setError("Esse insumo ja esta na receita");
      return;
    }
    setLinhas([...linhas, { insumoId, quantidadeUsada: novaQuantidade, porUnidade: novoPorUnidade }]);
    setNovoInsumoId("");
    setNovaQuantidade("");
    setNovoPorUnidade(false);
    setError(null);
  }

  function removerLinha(insumoId: number) {
    setLinhas(linhas.filter((l) => l.insumoId !== insumoId));
  }

  function atualizarQuantidade(insumoId: number, valor: string) {
    setLinhas(linhas.map((l) => (l.insumoId === insumoId ? { ...l, quantidadeUsada: valor } : l)));
  }

  function atualizarPorUnidade(insumoId: number, valor: boolean) {
    setLinhas(linhas.map((l) => (l.insumoId === insumoId ? { ...l, porUnidade: valor } : l)));
  }

  async function salvar() {
    setError(null);
    setSucesso(false);
    try {
      await salvarReceita.mutateAsync(
        linhas.map((l) => ({
          insumoId: l.insumoId,
          quantidadeUsada: Number(l.quantidadeUsada),
          porUnidade: l.porUnidade,
        }))
      );
      setSucesso(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar receita");
    }
  }

  function adicionarItemKit() {
    if (!novoProdutoKitId || !novaQuantidadeKit) return;
    const produtoCompId = Number(novoProdutoKitId);
    if (itensKit.some((l) => l.produtoId === produtoCompId)) {
      setError("Esse produto ja esta no kit");
      return;
    }
    setItensKit([...itensKit, { produtoId: produtoCompId, quantidade: novaQuantidadeKit }]);
    setNovoProdutoKitId("");
    setNovaQuantidadeKit("1");
    setError(null);
  }

  function removerItemKit(prodId: number) {
    setItensKit(itensKit.filter((l) => l.produtoId !== prodId));
  }

  function atualizarQuantidadeKit(prodId: number, valor: string) {
    setItensKit(itensKit.map((l) => (l.produtoId === prodId ? { ...l, quantidade: valor } : l)));
  }

  async function salvarComposicaoKit() {
    setError(null);
    setSucesso(false);
    try {
      await salvarKit.mutateAsync(
        itensKit.map((l) => ({ produtoId: l.produtoId, quantidade: Number(l.quantidade) }))
      );
      setSucesso(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar composição do kit");
    }
  }

  if (isLoading) return <Spinner />;
  if (!produto) return <ErrorBanner message="Produto nao encontrado" />;

  const custoPorKgCalculado = linhas.reduce((soma, l) => {
    if (l.porUnidade) return soma;
    const insumo = insumosPorId.get(l.insumoId);
    if (!insumo) return soma;
    return soma + Number(l.quantidadeUsada || 0) * Number(insumo.custoUnitarioAtual);
  }, 0);

  const custoPorUnidadeDireto = linhas.reduce((soma, l) => {
    if (!l.porUnidade) return soma;
    const insumo = insumosPorId.get(l.insumoId);
    if (!insumo) return soma;
    return soma + Number(l.quantidadeUsada || 0) * Number(insumo.custoUnitarioAtual);
  }, 0);

  const temItemPorPeso = linhas.some((l) => !l.porUnidade);
  const pesoDefinido = Number(produto.pesoUnidadeGramas) > 0;
  const custoPorUnidadeCalculado =
    (pesoDefinido ? (custoPorKgCalculado * Number(produto.pesoUnidadeGramas)) / 1000 : 0) + custoPorUnidadeDireto;

  const margem = Number(produto.precoVenda) - Number(produto.custoMedio);
  const margemReal = Number(produto.precoVenda) - produto.custoUnitarioCompleto;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/produtos" className="text-sm text-emerald-700 hover:underline">
          &larr; Voltar para produtos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-800">{produto.nome}</h1>
        <p className="text-sm text-slate-500">
          Preço de venda: R$ {Number(produto.precoVenda).toFixed(2)} · Custo por kg de massa: R${" "}
          {produto.custoPorKgMassa.toFixed(2)} · Custo médio (por unidade, insumos): R${" "}
          {Number(produto.custoMedio).toFixed(2)} · Custo completo (c/ rateio): R${" "}
          {produto.custoUnitarioCompleto.toFixed(2)} · Peso da unidade:{" "}
          {produto.pesoUnidadeGramas ? `${produto.pesoUnidadeGramas}g` : "não definido"} · Estoque
          {produto.ehKit ? " disponível (calculado pelos componentes)" : ""}:{" "}
          {produto.ehKit ? (produto.estoqueDisponivelKit ?? "—") : produto.estoqueAtual} · Margem (insumos):{" "}
          <span className={margem >= 0 ? "text-emerald-700" : "text-red-700"}>R$ {margem.toFixed(2)}</span> ·{" "}
          <strong>Margem real (c/ rateio)</strong>:{" "}
          <span className={`font-medium ${margemReal >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            R$ {margemReal.toFixed(2)}
          </span>
        </p>
      </div>

      {!produto.ehKit && (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-800">Receita</h2>
        <p className="mb-3 text-xs text-slate-500">
          As quantidades abaixo são por 1kg (1000g) de massa produzida, não por unidade — assim,
          trocar de molde é só atualizar o "Peso por unidade" no cadastro do produto, sem
          recadastrar a receita. Marque "Por unidade" num item (ex: embalagem/frasco) pra contar
          o custo dele direto por unidade vendida, sem escalar pelo peso — frasco custa o mesmo
          independente do peso do produto.
        </p>

        {temItemPorPeso && !pesoDefinido && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            Defina o "Peso por unidade (g)" no cadastro do produto (botão Editar) antes de
            salvar um item por kg de massa.
          </div>
        )}

        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}
        {sucesso && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            Receita salva com sucesso.
          </div>
        )}

        <div className="mb-4 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Insumo</th>
                <th className="px-4 py-2 font-medium">Quantidade</th>
                <th className="px-4 py-2 font-medium">Por unidade?</th>
                <th className="px-4 py-2 font-medium">Custo unitário do insumo</th>
                <th className="px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Nenhum insumo na receita ainda
                  </td>
                </tr>
              )}
              {linhas.map((linha) => {
                const insumo = insumosPorId.get(linha.insumoId);
                const subtotal = insumo
                  ? Number(linha.quantidadeUsada || 0) * Number(insumo.custoUnitarioAtual)
                  : 0;
                return (
                  <tr key={linha.insumoId}>
                    <td className="px-4 py-2">{insumo?.nome ?? `#${linha.insumoId}`}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={linha.quantidadeUsada}
                        onChange={(e) => atualizarQuantidade(linha.insumoId, e.target.value)}
                        className="w-24 rounded border border-slate-300 px-2 py-1"
                      />
                      <span className="ml-1 text-slate-500">
                        {linha.porUnidade ? "un" : insumo?.unidadeMedida}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={linha.porUnidade}
                        onChange={(e) => atualizarPorUnidade(linha.insumoId, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2">R$ {Number(insumo?.custoUnitarioAtual ?? 0).toFixed(4)}</td>
                    <td className="px-4 py-2">R$ {subtotal.toFixed(4)}</td>
                    <td className="px-4 py-2">
                      <button className="text-red-600 hover:underline" onClick={() => removerLinha(linha.insumoId)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Select label="Adicionar insumo" value={novoInsumoId} onChange={(e) => setNovoInsumoId(e.target.value)}>
            <option value="">Selecione...</option>
            {(insumos ?? [])
              .filter((i) => !linhas.some((l) => l.insumoId === i.id))
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
          </Select>
          <Input
            label={novoPorUnidade ? "Quantidade por unidade" : "Quantidade por kg de massa"}
            type="number"
            step="any"
            min="0"
            value={novaQuantidade}
            onChange={(e) => setNovaQuantidade(e.target.value)}
          />
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={novoPorUnidade}
              onChange={(e) => setNovoPorUnidade(e.target.checked)}
            />
            Por unidade (ex: embalagem)
          </label>
          <Button type="button" variant="secondary" onClick={adicionarLinha}>
            Adicionar
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Custo por kg de massa: <span className="font-medium">R$ {custoPorKgCalculado.toFixed(4)}</span>
            {" · "}Custo por unidade{pesoDefinido ? "" : " (defina o peso pra calcular)"}:{" "}
            <span className="font-medium">R$ {custoPorUnidadeCalculado.toFixed(4)}</span>
          </p>
          <Button
            onClick={salvar}
            disabled={salvarReceita.isPending || (temItemPorPeso && !pesoDefinido)}
          >
            {salvarReceita.isPending ? "Salvando..." : "Salvar receita"}
          </Button>
        </div>
      </div>
      )}

      {produto.ehKit && (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-800">Composição do kit</h2>
        <p className="mb-3 text-xs text-slate-500">
          Quando esse kit for vendido, cada produto abaixo tem seu próprio estoque baixado na
          quantidade indicada — o kit em si não tem estoque próprio.
        </p>

        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}
        {sucesso && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            Composição salva com sucesso.
          </div>
        )}

        <div className="mb-4 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium">Quantidade</th>
                <th className="px-4 py-2 font-medium">Custo unitário</th>
                <th className="px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itensKit.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Nenhum produto no kit ainda
                  </td>
                </tr>
              )}
              {itensKit.map((linha) => {
                const componente = produtosPorId.get(linha.produtoId);
                const subtotal = componente ? Number(linha.quantidade || 0) * Number(componente.custoMedio) : 0;
                return (
                  <tr key={linha.produtoId}>
                    <td className="px-4 py-2">{componente?.nome ?? `#${linha.produtoId}`}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={linha.quantidade}
                        onChange={(e) => atualizarQuantidadeKit(linha.produtoId, e.target.value)}
                        className="w-20 rounded border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2">R$ {Number(componente?.custoMedio ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-2">R$ {subtotal.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => removerItemKit(linha.produtoId)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Select
            label="Adicionar produto ao kit"
            value={novoProdutoKitId}
            onChange={(e) => setNovoProdutoKitId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {produtosDisponiveisParaKit
              .filter((p) => !itensKit.some((l) => l.produtoId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </Select>
          <Input
            label="Quantidade"
            type="number"
            step="1"
            min="1"
            value={novaQuantidadeKit}
            onChange={(e) => setNovaQuantidadeKit(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={adicionarItemKit}>
            Adicionar
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Custo médio do kit (soma dos componentes):{" "}
            <span className="font-medium">R$ {Number(produto.custoMedio).toFixed(2)}</span>
          </p>
          <Button onClick={salvarComposicaoKit} disabled={salvarKit.isPending}>
            {salvarKit.isPending ? "Salvando..." : "Salvar composição"}
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}
