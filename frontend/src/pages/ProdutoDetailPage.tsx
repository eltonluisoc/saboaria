import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProduto, useSalvarReceita } from "../hooks/useProdutos";
import { useInsumos } from "../hooks/useInsumos";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

interface ReceitaLinha {
  insumoId: number;
  quantidadeUsada: string;
}

export function ProdutoDetailPage() {
  const { id } = useParams();
  const produtoId = Number(id);
  const { data: produto, isLoading } = useProduto(produtoId);
  const { data: insumos } = useInsumos();
  const salvarReceita = useSalvarReceita(produtoId);

  const [linhas, setLinhas] = useState<ReceitaLinha[]>([]);
  const [novoInsumoId, setNovoInsumoId] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (produto) {
      setLinhas(
        produto.receita.map((item) => ({
          insumoId: item.insumoId,
          quantidadeUsada: item.quantidadeUsada,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto?.id]);

  const insumosPorId = new Map((insumos ?? []).map((i) => [i.id, i]));

  function adicionarLinha() {
    if (!novoInsumoId || !novaQuantidade) return;
    const insumoId = Number(novoInsumoId);
    if (linhas.some((l) => l.insumoId === insumoId)) {
      setError("Esse insumo ja esta na receita");
      return;
    }
    setLinhas([...linhas, { insumoId, quantidadeUsada: novaQuantidade }]);
    setNovoInsumoId("");
    setNovaQuantidade("");
    setError(null);
  }

  function removerLinha(insumoId: number) {
    setLinhas(linhas.filter((l) => l.insumoId !== insumoId));
  }

  function atualizarQuantidade(insumoId: number, valor: string) {
    setLinhas(linhas.map((l) => (l.insumoId === insumoId ? { ...l, quantidadeUsada: valor } : l)));
  }

  async function salvar() {
    setError(null);
    setSucesso(false);
    try {
      await salvarReceita.mutateAsync(
        linhas.map((l) => ({ insumoId: l.insumoId, quantidadeUsada: Number(l.quantidadeUsada) }))
      );
      setSucesso(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar receita");
    }
  }

  if (isLoading) return <Spinner />;
  if (!produto) return <ErrorBanner message="Produto nao encontrado" />;

  const custoCalculado = linhas.reduce((soma, l) => {
    const insumo = insumosPorId.get(l.insumoId);
    if (!insumo) return soma;
    return soma + Number(l.quantidadeUsada || 0) * Number(insumo.custoUnitarioAtual);
  }, 0);

  const margem = Number(produto.precoVenda) - Number(produto.custoMedio);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/produtos" className="text-sm text-emerald-700 hover:underline">
          &larr; Voltar para produtos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-800">{produto.nome}</h1>
        <p className="text-sm text-slate-500">
          Preço de venda: R$ {Number(produto.precoVenda).toFixed(2)} · Custo médio: R${" "}
          {Number(produto.custoMedio).toFixed(2)} · Margem:{" "}
          <span className={margem >= 0 ? "text-emerald-700" : "text-red-700"}>R$ {margem.toFixed(2)}</span>
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-800">Receita</h2>

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
                <th className="px-4 py-2 font-medium">Custo unitário</th>
                <th className="px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
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
                      <span className="ml-1 text-slate-500">{insumo?.unidadeMedida}</span>
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
            label="Quantidade"
            type="number"
            step="any"
            min="0"
            value={novaQuantidade}
            onChange={(e) => setNovaQuantidade(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={adicionarLinha}>
            Adicionar
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Custo médio calculado com estas linhas:{" "}
            <span className="font-medium">R$ {custoCalculado.toFixed(4)}</span>
          </p>
          <Button onClick={salvar} disabled={salvarReceita.isPending}>
            {salvarReceita.isPending ? "Salvando..." : "Salvar receita"}
          </Button>
        </div>
      </div>
    </div>
  );
}
