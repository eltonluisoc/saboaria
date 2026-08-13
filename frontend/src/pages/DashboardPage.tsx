import { useState } from "react";
import { useRelatorio } from "../hooks/useRelatorio";
import { Input } from "../components/ui/Input";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function primeiroDiaDoMes() {
  const now = new Date();
  return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
}

function formatMoeda(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function DashboardPage() {
  const [de, setDe] = useState(primeiroDiaDoMes());
  const [ate, setAte] = useState(formatDateInput(new Date()));
  const { data, isLoading, error } = useRelatorio(de, ate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Vendas, despesas e lucro no período selecionado</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Input label="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        <Input label="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
      </div>

      {isLoading && <Spinner />}
      {error && (
        <ErrorBanner message={error instanceof ApiError ? error.message : "Erro ao carregar relatorio"} />
      )}

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Total de vendas" value={formatMoeda(data.totalVendas)} tone="emerald" />
          <Card title="Despesas pagas" value={formatMoeda(data.totalDespesasPagas)} tone="red" />
          <Card title="Despesas em aberto" value={formatMoeda(data.totalDespesasEmAberto)} tone="amber" />
          <Card
            title="Lucro"
            value={formatMoeda(data.lucro)}
            tone={Number(data.lucro) >= 0 ? "emerald" : "red"}
          />
        </div>
      )}
    </div>
  );
}

function Card({ title, value, tone }: { title: string; value: string; tone: "emerald" | "red" | "amber" }) {
  const toneClass = tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-red-700";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
