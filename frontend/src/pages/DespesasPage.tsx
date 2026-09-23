import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  useCriarDespesa,
  useCriarDespesaParcelada,
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
type PeriodoPreset = "proximos30" | "mes" | "proximos3meses" | "ano" | "tudo";

const DIA_MS = 24 * 60 * 60 * 1000;

const PRESETS: { key: PeriodoPreset; label: string }[] = [
  { key: "proximos30", label: "Próximos 30 dias" },
  { key: "mes", label: "Este mês" },
  { key: "proximos3meses", label: "Próximos 3 meses" },
  { key: "ano", label: "Ano" },
  { key: "tudo", label: "Tudo" },
];

function inicioDoDiaUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dataEfetiva(d: DespesaGeral) {
  return new Date(d.dataVencimento ?? d.dataDespesa);
}

// Janela de cada chip - todo preset exceto "tudo" tambem inclui qualquer
// despesa nao paga com data efetiva anterior a hoje ("vencida em aberto"),
// nao importa a idade, pra nada pendente sumir da tela so por estar
// atrasado (mesmo conceito de relatorioController.alertas/despesasVencidas).
function calcularJanelaPreset(preset: PeriodoPreset, hoje: Date): { inicio: Date; fim: Date } | null {
  if (preset === "tudo") return null;
  if (preset === "mes") {
    return {
      inicio: new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1)),
      fim: new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0)),
    };
  }
  if (preset === "ano") {
    return {
      inicio: new Date(Date.UTC(hoje.getUTCFullYear(), 0, 1)),
      fim: new Date(Date.UTC(hoje.getUTCFullYear(), 11, 31)),
    };
  }
  const dias = preset === "proximos3meses" ? 90 : 30;
  return { inicio: hoje, fim: new Date(hoje.getTime() + dias * DIA_MS) };
}

function aplicarPreset(despesas: DespesaGeral[], preset: PeriodoPreset): DespesaGeral[] {
  const hoje = inicioDoDiaUTC(new Date());
  const janela = calcularJanelaPreset(preset, hoje);
  if (janela === null) return despesas;
  return despesas.filter((d) => {
    const efetiva = dataEfetiva(d);
    const dentroDaJanela = efetiva >= janela.inicio && efetiva <= janela.fim;
    const vencidaEmAberto = !d.pago && efetiva < hoje;
    return dentroDaJanela || vencidaEmAberto;
  });
}

type LinhaExibicao =
  | { tipo: "despesa"; despesa: DespesaGeral }
  | {
      tipo: "grupo";
      chave: string;
      origemBadge: "recorrencia" | "prolabore" | "parcelada";
      descricaoBase: string;
      categoria: string | null;
      formaPagamento: string | null;
      quantidade: number;
      total: number;
      dataAte: string;
      itens: DespesaGeral[];
    };

function chaveOrigem(d: DespesaGeral): string | null {
  if (d.despesaOrigemId !== null) return `recorrencia-${d.despesaOrigemId}`;
  if (d.proLaboreId !== null) return `prolabore-${d.proLaboreId}`;
  if (d.compraParceladaId !== null) return `parcelada-${d.compraParceladaId}`;
  return null;
}

// Junta despesas nao pagas da mesma serie (recorrencia/pro-labore/compra
// parcelada) numa linha-resumo quando ha mais de 2 ocorrencias no recorte
// atual - evita repetir 10+ linhas iguais so pra planejamento. Pagas nunca
// agrupam, ficam sempre soltas (preserva o historico).
function agruparParaExibicao(despesas: DespesaGeral[]): LinhaExibicao[] {
  const grupos = new Map<string, DespesaGeral[]>();
  const soltas: DespesaGeral[] = [];

  for (const d of despesas) {
    const chave = chaveOrigem(d);
    if (chave === null || d.pago) {
      soltas.push(d);
      continue;
    }
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(d);
  }

  const linhas: LinhaExibicao[] = soltas.map((d) => ({ tipo: "despesa" as const, despesa: d }));

  for (const [chave, itens] of grupos) {
    if (itens.length <= 2) {
      linhas.push(...itens.map((d) => ({ tipo: "despesa" as const, despesa: d })));
      continue;
    }
    itens.sort((a, b) => dataEfetiva(a).getTime() - dataEfetiva(b).getTime());
    linhas.push({
      tipo: "grupo",
      chave,
      origemBadge: chave.split("-")[0] as "recorrencia" | "prolabore" | "parcelada",
      descricaoBase: itens[0].descricao.replace(/\s*\(\d+\/\d+\)$/, ""),
      categoria: itens[0].categoria,
      formaPagamento: itens[0].formaPagamento,
      quantidade: itens.length,
      total: itens.reduce((soma, d) => soma + Number(d.valor), 0),
      dataAte: (itens[itens.length - 1].dataVencimento ?? itens[itens.length - 1].dataDespesa) as string,
      itens,
    });
  }

  linhas.sort((a, b) => {
    const dataA = a.tipo === "grupo" ? dataEfetiva(a.itens[0]) : dataEfetiva(a.despesa);
    const dataB = b.tipo === "grupo" ? dataEfetiva(b.itens[0]) : dataEfetiva(b.despesa);
    return dataA.getTime() - dataB.getTime();
  });

  return linhas;
}

export function DespesasPage() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [periodoPreset, setPeriodoPreset] = useState<PeriodoPreset>("proximos30");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todas");
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(new Set());
  const filtroManualAtivo = Boolean(de && ate);
  const { data: despesas, isLoading, error } = useDespesas(filtroManualAtivo ? { de, ate } : undefined);
  const [modalDespesa, setModalDespesa] = useState<DespesaGeral | null | undefined>(undefined);
  const remover = useRemoverDespesa();
  const marcarPaga = useMarcarDespesaPaga();
  const marcarEmAberto = useMarcarDespesaEmAberto();
  const [actionError, setActionError] = useState<string | null>(null);

  // Os totais do topo somam TODAS as despesas do array carregado (sem
  // preset de periodo aplicado) - sem filtro manual, "despesas" vem inteiro
  // do servidor e os totais batem com o Dashboard; com filtro manual de
  // data, "despesas" ja vem recortado pelo servidor (comportamento existente
  // preservado). O preset de periodo (chips) so afeta o que e EXIBIDO na
  // tabela abaixo, nunca esses totais.
  const totalAberto = despesas?.filter((d) => !d.pago).reduce((soma, d) => soma + Number(d.valor), 0) ?? 0;
  const totalPago = despesas?.filter((d) => d.pago).reduce((soma, d) => soma + Number(d.valor), 0) ?? 0;
  const countAberto = despesas?.filter((d) => !d.pago).length ?? 0;
  const countPago = despesas?.filter((d) => d.pago).length ?? 0;

  const despesasNoPeriodo = filtroManualAtivo ? (despesas ?? []) : aplicarPreset(despesas ?? [], periodoPreset);

  const despesasFiltradas = despesasNoPeriodo.filter((d) => {
    if (statusFiltro === "pagas") return d.pago;
    if (statusFiltro === "abertas") return !d.pago;
    return true;
  });

  const linhasAgrupadas = agruparParaExibicao(despesasFiltradas);
  const linhasExibidas = linhasAgrupadas.flatMap((linha) => {
    if (linha.tipo === "despesa") return [linha];
    if (!gruposExpandidos.has(linha.chave)) return [linha];
    return [linha, ...linha.itens.map((d) => ({ tipo: "despesa" as const, despesa: d }))];
  });

  function alternarGrupo(chave: string) {
    setGruposExpandidos((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) {
        novo.delete(chave);
      } else {
        novo.add(chave);
      }
      return novo;
    });
  }

  async function handleRemover(despesa: DespesaGeral) {
    const fazParteDeRecorrencia = despesa.recorrente || despesa.despesaOrigemId !== null;
    const mensagem =
      despesa.compraParceladaId !== null
        ? `Remover a compra parcelada "${despesa.descricao}"? Isso remove TODAS as ${despesa.compraParcelada?.totalParcelas ?? ""} parcelas dessa compra (só é possível porque nenhuma foi paga ainda).`
        : fazParteDeRecorrencia
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
              setPeriodoPreset("proximos30");
            }}
          >
            Limpar filtro
          </Button>
        )}
      </div>

      {!filtroManualAtivo && (
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => setPeriodoPreset(preset.key)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                periodoPreset === preset.key
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

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
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {!filtroManualAtivo && periodoPreset !== "tudo" && (
              <span className="text-slate-500">
                Mostrando {despesasFiltradas.length} de {despesas.length} despesas
              </span>
            )}
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

      {despesas && (
        <Table
          rows={linhasExibidas}
          emptyMessage={
            statusFiltro === "pagas"
              ? "Nenhuma despesa paga nesse período."
              : statusFiltro === "abertas"
                ? "Nenhuma despesa em aberto nesse período."
                : "Nenhuma despesa nesse período."
          }
          keyField={(linha) => (linha.tipo === "grupo" ? `grupo-${linha.chave}` : linha.despesa.id)}
          columns={[
            {
              header: "Descrição",
              render: (linha) => {
                if (linha.tipo === "despesa") return linha.despesa.descricao;
                const expandido = gruposExpandidos.has(linha.chave);
                return (
                  <button
                    className="text-left font-medium text-slate-700 hover:underline"
                    onClick={() => alternarGrupo(linha.chave)}
                  >
                    {expandido ? "▾" : "▸"} {linha.descricaoBase}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      ({linha.quantidade} parcelas futuras)
                    </span>
                  </button>
                );
              },
            },
            {
              header: "Categoria",
              render: (linha) => (linha.tipo === "grupo" ? (linha.categoria ?? "—") : (linha.despesa.categoria ?? "—")),
            },
            {
              header: "Valor",
              render: (linha) =>
                linha.tipo === "grupo"
                  ? `R$ ${linha.total.toFixed(2)} (total)`
                  : `R$ ${Number(linha.despesa.valor).toFixed(2)}`,
            },
            {
              header: "Data de pagamento",
              render: (linha) => {
                if (linha.tipo === "grupo") {
                  const ateFormatada = new Date(linha.dataAte).toLocaleDateString("pt-BR", { timeZone: "UTC" });
                  return `até ${ateFormatada}`;
                }
                const row = linha.despesa;
                const efetivaStr = row.dataVencimento ?? row.dataDespesa;
                const formatada = new Date(efetivaStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
                // Quando ha vencimento diferente da data de lancamento, mostra os
                // dois - a data de pagamento e a que manda (filtro, ordenacao),
                // mas a data de lancamento continua visivel como referencia.
                if (row.dataVencimento && row.dataVencimento !== row.dataDespesa) {
                  const lancamento = new Date(row.dataDespesa).toLocaleDateString("pt-BR", { timeZone: "UTC" });
                  return (
                    <span>
                      {formatada}
                      <span className="block text-xs text-slate-400">lançada em {lancamento}</span>
                    </span>
                  );
                }
                return formatada;
              },
            },
            {
              header: "Recorrente",
              render: (linha) => {
                if (linha.tipo === "grupo") return "—";
                return linha.despesa.recorrente ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Sim
                  </span>
                ) : (
                  "Não"
                );
              },
            },
            {
              header: "Origem",
              render: (linha) => {
                if (linha.tipo === "grupo") {
                  const label =
                    linha.origemBadge === "prolabore"
                      ? "Pró-labore"
                      : linha.origemBadge === "parcelada"
                        ? "Compra parcelada"
                        : "Gerada automaticamente";
                  return (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {label}
                    </span>
                  );
                }
                const row = linha.despesa;
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
                if (row.proLaboreId !== null) {
                  return (
                    <Link
                      to="/admin/pro-labore"
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Pró-labore
                    </Link>
                  );
                }
                if (row.compraParceladaId !== null) {
                  return (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Parcela {row.numeroParcela}/{row.compraParcelada?.totalParcelas ?? "?"}
                    </span>
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
              header: "Forma de pagamento",
              render: (linha) => (linha.tipo === "grupo" ? (linha.formaPagamento ?? "—") : (linha.despesa.formaPagamento ?? "—")),
            },
            {
              header: "Status",
              render: (linha) => {
                if (linha.tipo === "grupo") {
                  return (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {linha.quantidade} em aberto
                    </span>
                  );
                }
                const row = linha.despesa;
                return row.pago ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Paga
                    {row.dataPagamento &&
                      ` em ${new Date(row.dataPagamento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Em aberto
                  </span>
                );
              },
            },
            {
              header: "Ações",
              render: (linha) => {
                if (linha.tipo === "grupo") {
                  const expandido = gruposExpandidos.has(linha.chave);
                  return (
                    <button
                      className="text-sm text-slate-600 hover:underline"
                      onClick={() => alternarGrupo(linha.chave)}
                    >
                      {expandido ? "Recolher" : "Ver parcelas"}
                    </button>
                  );
                }
                const row = linha.despesa;
                const editarLabel =
                  row.compraInsumoId !== null
                    ? "Editar em Insumos"
                    : row.proLaboreId !== null
                      ? "Editar em Pró-labore"
                      : row.compraParceladaId !== null
                        ? "Editar bloqueado"
                        : null;
                return (
                  <div className="flex gap-3">
                    <button
                      className="text-sm text-slate-600 hover:underline"
                      onClick={() => handleAlternarPagamento(row)}
                    >
                      {row.pago ? "Marcar como em aberto" : "Marcar como paga"}
                    </button>
                    {editarLabel !== null ? (
                      <span className="text-sm text-slate-400">{editarLabel}</span>
                    ) : (
                      <button className="text-sm text-slate-600 hover:underline" onClick={() => setModalDespesa(row)}>
                        Editar
                      </button>
                    )}
                    <button className="text-sm text-red-600 hover:underline" onClick={() => handleRemover(row)}>
                      Remover
                    </button>
                  </div>
                );
              },
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

const OPCOES_FORMA_PAGAMENTO = ["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito", "Boleto"];

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
  const [formaPagamento, setFormaPagamento] = useState(despesa?.formaPagamento ?? "");
  const [parcelado, setParcelado] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const criar = useCriarDespesa();
  const editar = useEditarDespesa(despesa?.id ?? 0);
  const criarParcelada = useCriarDespesaParcelada();
  const salvando = criar.isPending || editar.isPending || criarParcelada.isPending;

  function handleParceladoChange(marcado: boolean) {
    setParcelado(marcado);
    if (marcado && !formaPagamento) {
      setFormaPagamento("Cartão de crédito");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (!despesa && parcelado) {
        await criarParcelada.mutateAsync({
          descricao,
          valorTotal: Number(valor),
          categoria: categoria || null,
          dataDespesa,
          formaPagamento: formaPagamento || null,
          totalParcelas: Number(numeroParcelas),
        });
        onClose();
        return;
      }
      const dados = {
        descricao,
        valor: Number(valor),
        categoria: categoria || null,
        dataDespesa,
        recorrente,
        dataFimRecorrencia: recorrente && dataFimRecorrencia ? dataFimRecorrencia : null,
        dataVencimento: dataVencimento || null,
        formaPagamento: formaPagamento || null,
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
          label={parcelado ? "Valor total (R$)" : "Valor (R$)"}
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
        <label className="block text-sm text-slate-700">
          Forma de pagamento
          <select
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
          >
            <option value="">—</option>
            {OPCOES_FORMA_PAGAMENTO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </label>
        {!despesa && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={parcelado}
              onChange={(e) => handleParceladoChange(e.target.checked)}
            />
            Parcelado no cartão
          </label>
        )}
        {parcelado ? (
          <Input
            label="Número de parcelas"
            type="number"
            min="2"
            max="36"
            step="1"
            value={numeroParcelas}
            onChange={(e) => setNumeroParcelas(e.target.value)}
            required
          />
        ) : (
          <>
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
          </>
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
