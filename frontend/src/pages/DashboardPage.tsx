import { useState } from "react";
import { useAlertas, useMediaVendas, useProdutosMaisVendidos, useRelatorio } from "../hooks/useRelatorio";
import { Input } from "../components/ui/Input";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

const DESDE_O_INICIO_DE = "2000-01-01";

type PeriodoRapido = "30d" | "12m" | "ano" | "tudo" | "custom";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hoje() {
  return formatDateInput(new Date());
}

function ultimos30Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatDateInput(d);
}

function ultimos12Meses() {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  return formatDateInput(d);
}

function inicioDoAno() {
  const d = new Date();
  return formatDateInput(new Date(d.getFullYear(), 0, 1));
}

function formatMoeda(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatNumero2(valor: number) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// "2026-08-16" -> "16/08/2026" (sem passar por Date, pra nao mudar de dia por fuso)
function formatDiaISO(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatData(valor: string) {
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function DashboardPage() {
  const [periodoAtivo, setPeriodoAtivo] = useState<PeriodoRapido>("12m");
  const [de, setDe] = useState(ultimos12Meses());
  const [ate, setAte] = useState(hoje());
  const [granularidadeMedia, setGranularidadeMedia] = useState<"quinzenal" | "mensal">("quinzenal");

  const desdeOInicio = useRelatorio(DESDE_O_INICIO_DE, hoje());
  const periodo = useRelatorio(de, ate);
  const produtosMaisVendidos = useProdutosMaisVendidos(de, ate);
  const alertas = useAlertas();
  const mediaVendas = useMediaVendas(granularidadeMedia);

  function selecionarPeriodoRapido(opcao: PeriodoRapido) {
    setPeriodoAtivo(opcao);
    if (opcao === "30d") {
      setDe(ultimos30Dias());
      setAte(hoje());
    } else if (opcao === "12m") {
      setDe(ultimos12Meses());
      setAte(hoje());
    } else if (opcao === "ano") {
      setDe(inicioDoAno());
      setAte(hoje());
    } else if (opcao === "tudo") {
      setDe(DESDE_O_INICIO_DE);
      setAte(hoje());
    }
  }

  const botoesRapidos: { key: PeriodoRapido; label: string }[] = [
    { key: "30d", label: "Últimos 30 dias" },
    { key: "12m", label: "Últimos 12 meses" },
    { key: "ano", label: "Ano atual" },
    { key: "tudo", label: "Tudo" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Vendas, despesas, lucro e alertas operacionais</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Desde o início</h2>
        {desdeOInicio.isLoading && <Spinner />}
        {desdeOInicio.error && (
          <ErrorBanner
            message={desdeOInicio.error instanceof ApiError ? desdeOInicio.error.message : "Erro ao carregar relatorio"}
          />
        )}
        {desdeOInicio.data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card title="Total vendido" value={formatMoeda(desdeOInicio.data.totalVendas)} tone="emerald" />
            <Card title="Despesas pagas" value={formatMoeda(desdeOInicio.data.totalDespesasPagas)} tone="red" />
            <Card title="Despesas em aberto" value={formatMoeda(desdeOInicio.data.totalDespesasEmAberto)} tone="amber" />
            <Card
              title="Pró-labore"
              value={formatMoeda(
                (Number(desdeOInicio.data.totalProLaborePago) + Number(desdeOInicio.data.totalProLaboreEmAberto)).toFixed(2)
              )}
              tone="slate"
            />
            <Card
              title="Lucro acumulado"
              value={formatMoeda(desdeOInicio.data.lucro)}
              tone={Number(desdeOInicio.data.lucro) >= 0 ? "emerald" : "red"}
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Média de vendas por dia
          </h2>
          <div className="flex gap-2">
            {(
              [
                { key: "quinzenal", label: "Quinzenal" },
                { key: "mensal", label: "Mensal" },
              ] as { key: "quinzenal" | "mensal"; label: string }[]
            ).map((opcao) => (
              <button
                key={opcao.key}
                onClick={() => setGranularidadeMedia(opcao.key)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  granularidadeMedia === opcao.key
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>
        {mediaVendas.isLoading && <Spinner />}
        {mediaVendas.error && (
          <ErrorBanner
            message={mediaVendas.error instanceof ApiError ? mediaVendas.error.message : "Erro ao carregar média de vendas"}
          />
        )}
        {mediaVendas.data && mediaVendas.data.primeiraVenda === null && (
          <p className="text-sm text-slate-500">Ainda não há vendas confirmadas pra calcular a média.</p>
        )}
        {mediaVendas.data && mediaVendas.data.primeiraVenda !== null && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card
                title="Média atual em R$ por dia"
                value={formatMoeda(String(mediaVendas.data.mediaValorPorDia))}
                subtitle={`${formatMoeda(String(mediaVendas.data.totalValor))} em ${mediaVendas.data.dias} dias · desde ${formatDiaISO(mediaVendas.data.primeiraVenda)}`}
                tone="emerald"
              />
              <Card
                title="Média atual em produtos por dia"
                value={`${formatNumero2(mediaVendas.data.mediaUnidadesPorDia)} un.`}
                subtitle={`${mediaVendas.data.totalUnidades} unidades em ${mediaVendas.data.dias} dias · desde ${formatDiaISO(mediaVendas.data.primeiraVenda)}`}
                tone="emerald"
              />
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Período</th>
                    <th className="px-4 py-2">Dias</th>
                    <th className="px-4 py-2">Vendido</th>
                    <th className="px-4 py-2">Média R$/dia</th>
                    <th className="px-4 py-2">Unidades</th>
                    <th className="px-4 py-2">Média un./dia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...mediaVendas.data.historico].reverse().map((h) => (
                    <tr key={h.inicio}>
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {formatDiaISO(h.inicio)} – {formatDiaISO(h.fim)}
                        {h.emAndamento && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            em andamento
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{h.dias}</td>
                      <td className="px-4 py-2 text-slate-600">{formatMoeda(String(h.totalValor))}</td>
                      <td className="px-4 py-2 font-medium text-slate-700">{formatMoeda(String(h.mediaValorPorDia))}</td>
                      <td className="px-4 py-2 text-slate-600">{h.totalUnidades}</td>
                      <td className="px-4 py-2 font-medium text-slate-700">{formatNumero2(h.mediaUnidadesPorDia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Período selecionado</h2>
          <div className="flex flex-wrap gap-2">
            {botoesRapidos.map((opcao) => (
              <button
                key={opcao.key}
                onClick={() => selecionarPeriodoRapido(opcao.key)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  periodoAtivo === opcao.key
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="De"
            type="date"
            value={de}
            onChange={(e) => {
              setDe(e.target.value);
              setPeriodoAtivo("custom");
            }}
          />
          <Input
            label="Até"
            type="date"
            value={ate}
            onChange={(e) => {
              setAte(e.target.value);
              setPeriodoAtivo("custom");
            }}
          />
        </div>

        {periodo.isLoading && <Spinner />}
        {periodo.error && (
          <ErrorBanner message={periodo.error instanceof ApiError ? periodo.error.message : "Erro ao carregar relatorio"} />
        )}
        {periodo.data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Card title="Vendas" value={formatMoeda(periodo.data.totalVendas)} tone="emerald" />
            <Card title="Despesas pagas" value={formatMoeda(periodo.data.totalDespesasPagas)} tone="red" />
            <Card title="Despesas em aberto" value={formatMoeda(periodo.data.totalDespesasEmAberto)} tone="amber" />
            <Card
              title="Pró-labore"
              value={formatMoeda(
                (Number(periodo.data.totalProLaborePago) + Number(periodo.data.totalProLaboreEmAberto)).toFixed(2)
              )}
              tone="slate"
            />
            <Card
              title="Lucro"
              value={formatMoeda(periodo.data.lucro)}
              tone={Number(periodo.data.lucro) >= 0 ? "emerald" : "red"}
            />
            <Card
              title="Margem de lucro"
              value={`${(Number(periodo.data.margemLucro) * 100).toFixed(1)}%`}
              tone={Number(periodo.data.margemLucro) >= 0 ? "emerald" : "red"}
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Alertas</h2>
        {alertas.isLoading && <Spinner />}
        {alertas.error && (
          <ErrorBanner message={alertas.error instanceof ApiError ? alertas.error.message : "Erro ao carregar alertas"} />
        )}
        {alertas.data && (
          <AlertasBlock
            despesasVencidas={alertas.data.despesasVencidas}
            insumosAbaixoDoMinimo={alertas.data.insumosAbaixoDoMinimo}
            pedidosPendentes={alertas.data.pedidosPendentes}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Produtos mais vendidos no período
        </h2>
        {produtosMaisVendidos.isLoading && <Spinner />}
        {produtosMaisVendidos.error && (
          <ErrorBanner
            message={
              produtosMaisVendidos.error instanceof ApiError
                ? produtosMaisVendidos.error.message
                : "Erro ao carregar produtos mais vendidos"
            }
          />
        )}
        {produtosMaisVendidos.data && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {produtosMaisVendidos.data.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Nenhuma venda paga nesse período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Produto</th>
                    <th className="px-4 py-2">Quantidade</th>
                    <th className="px-4 py-2">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {produtosMaisVendidos.data.map((p) => (
                    <tr key={p.produtoId}>
                      <td className="px-4 py-2 font-medium text-slate-700">{p.nome}</td>
                      <td className="px-4 py-2 text-slate-600">{p.quantidade}</td>
                      <td className="px-4 py-2 text-slate-600">{formatMoeda(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Card({
  title,
  value,
  tone,
  subtitle,
}: {
  title: string;
  value: string;
  tone: "emerald" | "red" | "amber" | "slate";
  subtitle?: string;
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "slate"
          ? "text-slate-700"
          : "text-red-700";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

function AlertasBlock({
  despesasVencidas,
  insumosAbaixoDoMinimo,
  pedidosPendentes,
}: {
  despesasVencidas: { id: number; descricao: string; valor: string; dataVencimento: string | null; dataDespesa: string }[];
  insumosAbaixoDoMinimo: { id: number; nome: string; unidadeMedida: string; estoqueAtual: string; estoqueMinimo: string | null }[];
  pedidosPendentes: { id: number; valorTotal: string; dataPedido: string; cliente: { nome: string } | null }[];
}) {
  const semAlertas =
    despesasVencidas.length === 0 && insumosAbaixoDoMinimo.length === 0 && pedidosPendentes.length === 0;

  if (semAlertas) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Nenhum alerta no momento.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {despesasVencidas.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-red-800">Despesas em aberto vencidas</h3>
          <ul className="space-y-1 text-sm text-red-700">
            {despesasVencidas.map((d) => (
              <li key={d.id}>
                {d.descricao} — {formatMoeda(d.valor)} (venceu em {formatData(d.dataVencimento ?? d.dataDespesa)})
              </li>
            ))}
          </ul>
        </div>
      )}
      {insumosAbaixoDoMinimo.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-800">Insumos abaixo do estoque mínimo</h3>
          <ul className="space-y-1 text-sm text-amber-700">
            {insumosAbaixoDoMinimo.map((i) => (
              <li key={i.id}>
                {i.nome}: {Number(i.estoqueAtual)} {i.unidadeMedida} (mínimo {Number(i.estoqueMinimo)} {i.unidadeMedida})
              </li>
            ))}
          </ul>
        </div>
      )}
      {pedidosPendentes.length > 0 && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-sky-800">Pedidos pendentes há mais de 3 dias</h3>
          <ul className="space-y-1 text-sm text-sky-700">
            {pedidosPendentes.map((p) => (
              <li key={p.id}>
                #{p.id} {p.cliente?.nome ?? "cliente nao identificado"} — {formatMoeda(p.valorTotal)} (desde{" "}
                {formatData(p.dataPedido)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
