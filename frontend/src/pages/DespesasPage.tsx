import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  useCriarDespesa,
  useDespesas,
  useEditarDespesa,
  useMarcarDespesaEmAberto,
  useMarcarDespesaPaga,
  useRemoverDespesa,
} from "../hooks/useDespesas";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";
import type { DespesaGeral } from "../types";

type StatusFiltro = "todas" | "abertas" | "pagas";

export function DespesasPage() {
  // Sem filtro de data por padrao - mostra tudo, pra bater com os totais do
  // Dashboard e nao confundir (um recorte por data so aqui dava a impressao
  // de numero errado quando comparado com o Dashboard, que nao tem esse
  // recorte). Quem quiser um periodo especifico aplica o filtro manualmente.
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todas");
  const { data: despesas, isLoading, error } = useDespesas(de && ate ? { de, ate } : undefined);
  const [modalDespesa, setModalDespesa] = useState<DespesaGeral | null | undefined>(undefined);
  const remover = useRemoverDespesa();
  const marcarPaga = useMarcarDespesaPaga();
  const marcarEmAberto = useMarcarDespesaEmAberto();
  const [actionError, setActionError] = useState<string | null>(null);

  const totalAberto = despesas?.filter((d) => !d.pago).reduce((soma, d) => soma + Number(d.valor), 0) ?? 0;
  const totalPago = despesas?.filter((d) => d.pago).reduce((soma, d) => soma + Number(d.valor), 0) ?? 0;
  const countAberto = despesas?.filter((d) => !d.pago).length ?? 0;
  const countPago = despesas?.filter((d) => d.pago).length ?? 0;

  const despesasFiltradas = despesas?.filter((d) => {
    if (statusFiltro === "pagas") return d.pago;
    if (statusFiltro === "abertas") return !d.pago;
    return true;
  });

  async function handleRemover(despesa: DespesaGeral) {
    const fazParteDeRecorrencia = despesa.recorrente || despesa.despesaOrigemId !== null;
    const mensagem = fazParteDeRecorrencia
      ? `Remover a despesa recorrente "${despesa.descricao}"? Isso remove TODAS as ocorrências dessa recorrência (inclusive as já pagas) e para a geração automática de novas cópias.`
      : `Remover a despesa "${despesa.descricao}"?`;
    if (!confirm(mensagem)) return;
    setActionError(null);
    try {
      await remover.mutateAsync(despesa.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao remover despesa");
    }
  }

  async function handleAlternarPagamento(despesa: DespesaGeral) {
    setActionError(null);
    try {
      if (despesa.pago) {
        await marcarEmAberto.mutateAsync(despesa.id);
      } else {
        await marcarPaga.mutateAsync(despesa.id);
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao atualizar pagamento");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Despesas gerais</h1>
          <p className="text-sm text-slate-500">Aluguel, embalagens, e outros custos fora dos insumos</p>
        </div>
        <Button onClick={() => setModalDespesa(null)}>Nova despesa</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Input label="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        <Input label="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        {(de || ate) && (
          <Button
            variant="secondary"
            onClick={() => {
              setDe("");
              setAte("");
            }}
          >
            Limpar filtro
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "todas", label: "Todas" },
              { key: "abertas", label: "Não pagas" },
              { key: "pagas", label: "Pagas" },
            ] as { key: StatusFiltro; label: string }[]
          ).map((opcao) => (
            <button
              key={opcao.key}
              onClick={() => setStatusFiltro(opcao.key)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                statusFiltro === opcao.key
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {opcao.label}
            </button>
          ))}
        </div>

        {despesas && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
              {countAberto} em aberto · R$ {totalAberto.toFixed(2)}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
              {countPago} pagas · R$ {totalPago.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {actionError && <ErrorBanner message={actionError} />}
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Erro ao carregar despesas" />}

      {despesasFiltradas && (
        <Table
          rows={despesasFiltradas}
          emptyMessage={
            statusFiltro === "pagas"
              ? "Nenhuma despesa paga nesse período."
              : statusFiltro === "abertas"
                ? "Nenhuma despesa em aberto nesse período."
                : "Nenhuma despesa nesse período."
          }
          keyField={(row) => row.id}
          columns={[
            { header: "Descrição", render: (row) => row.descricao },
            { header: "Categoria", render: (row) => row.categoria ?? "—" },
            { header: "Valor", render: (row) => `R$ ${Number(row.valor).toFixed(2)}` },
            {
              header: "Data",
              render: (row) => new Date(row.dataDespesa).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
            },
            {
              header: "Recorrente",
              render: (row) =>
                row.recorrente ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Sim
                  </span>
                ) : (
                  "Não"
                ),
            },
            {
              header: "Origem",
              render: (row) => {
                if (row.compraInsumo) {
                  return (
                    <Link
                      to={`/admin/insumos/${row.compraInsumo.insumoId}`}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Compra de insumo
                    </Link>
                  );
                }
                if (row.despesaOrigemId !== null) {
                  return (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Gerada automaticamente
                    </span>
                  );
                }
                return "—";
              },
            },
            {
              header: "Pagamento",
              render: (row) =>
                row.pago ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Paga
                    {row.dataPagamento &&
                      ` em ${new Date(row.dataPagamento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Em aberto
                  </span>
                ),
            },
            {
              header: "Ações",
              render: (row) =>
                row.compraInsumoId !== null ? (
                  <span className="text-sm text-slate-400">Editar em Insumos</span>
                ) : (
                  <div className="flex gap-3">
                    <button
                      className="text-sm text-slate-600 hover:underline"
                      onClick={() => handleAlternarPagamento(row)}
                    >
                      {row.pago ? "Marcar como em aberto" : "Marcar como paga"}
                    </button>
                    <button className="text-sm text-slate-600 hover:underline" onClick={() => setModalDespesa(row)}>
                      Editar
                    </button>
                    <button className="text-sm text-red-600 hover:underline" onClick={() => handleRemover(row)}>
                      Remover
                    </button>
                  </div>
                ),
            },
          ]}
        />
      )}

      {modalDespesa !== undefined && (
        <DespesaFormModal despesa={modalDespesa} onClose={() => setModalDespesa(undefined)} />
      )}
    </div>
  );
}

function DespesaFormModal({ despesa, onClose }: { despesa: DespesaGeral | null; onClose: () => void }) {
  const [descricao, setDescricao] = useState(despesa?.descricao ?? "");
  const [valor, setValor] = useState(despesa?.valor ?? "");
  const [categoria, setCategoria] = useState(despesa?.categoria ?? "");
  const [dataDespesa, setDataDespesa] = useState(
    despesa?.dataDespesa.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [recorrente, setRecorrente] = useState(despesa?.recorrente ?? false);
  const [dataFimRecorrencia, setDataFimRecorrencia] = useState(
    despesa?.dataFimRecorrencia?.slice(0, 10) ?? ""
  );
  const [dataVencimento, setDataVencimento] = useState(despesa?.dataVencimento?.slice(0, 10) ?? "");
  const [error, setError] = useState<string | null>(null);
  const criar = useCriarDespesa();
  const editar = useEditarDespesa(despesa?.id ?? 0);
  const salvando = criar.isPending || editar.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const dados = {
        descricao,
        valor: Number(valor),
        categoria: categoria || null,
        dataDespesa,
        recorrente,
        dataFimRecorrencia: recorrente && dataFimRecorrencia ? dataFimRecorrencia : null,
        dataVencimento: dataVencimento || null,
      };
      if (despesa) {
        await editar.mutateAsync(dados);
      } else {
        await criar.mutateAsync(dados);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar despesa");
    }
  }

  return (
    <Modal title={despesa ? "Editar despesa" : "Nova despesa"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
        <Input
          label="Valor (R$)"
          type="number"
          step="any"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
        <Input label="Categoria (opcional)" value={categoria ?? ""} onChange={(e) => setCategoria(e.target.value)} />
        <Input
          label="Data"
          type="date"
          value={dataDespesa}
          onChange={(e) => setDataDespesa(e.target.value)}
          required
        />
        <Input
          label="Data de vencimento (opcional, se vazio considera a data da despesa)"
          type="date"
          value={dataVencimento}
          onChange={(e) => setDataVencimento(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
          Despesa recorrente (ex: aluguel mensal)
        </label>
        {recorrente && (
          <Input
            label="Data de fim da recorrência (opcional, vazio = indefinida)"
            type="date"
            value={dataFimRecorrencia}
            onChange={(e) => setDataFimRecorrencia(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
