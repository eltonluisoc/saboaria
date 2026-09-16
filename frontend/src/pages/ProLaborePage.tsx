import { useState, type FormEvent } from "react";
import {
  useAtualizarValorProLabore,
  useConfigurarProLabore,
  useProLabore,
} from "../hooks/useProLabore";
import { useMarcarDespesaEmAberto, useMarcarDespesaPaga } from "../hooks/useDespesas";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";
import type { DespesaGeral } from "../types";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function mesAnoPorExtenso(data: Date) {
  return `${MESES[data.getUTCMonth()]} de ${data.getUTCFullYear()}`;
}

function proximoMes(): Date {
  const hoje = new Date();
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1));
}

export function ProLaborePage() {
  const { data, isLoading, error } = useProLabore();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Pró-labore</h1>
        <p className="text-sm text-slate-500">Sua remuneração mensal como dono(a) do negócio</p>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Erro ao carregar pró-labore" />}

      {data && !data.configurado && <ConfigurarForm />}
      {data && data.configurado && <PainelConfigurado data={data} />}
    </div>
  );
}

function ConfigurarForm() {
  const [valor, setValor] = useState("");
  const [diaPagamento, setDiaPagamento] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const configurar = useConfigurarProLabore();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await configurar.mutateAsync({ valor: Number(valor), diaPagamento: Number(diaPagamento) });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao configurar pró-labore");
    }
  }

  return (
    <div className="max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-lg font-medium text-slate-800">Configurar pró-labore</h2>
      <p className="mb-4 text-sm text-slate-500">
        Ao salvar, já lança as parcelas dos próximos 12 meses (todas em aberto).
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Input
          label="Valor mensal (R$)"
          type="number"
          step="any"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
        <Input
          label="Dia do pagamento (1-28)"
          type="number"
          min="1"
          max="28"
          value={diaPagamento}
          onChange={(e) => setDiaPagamento(e.target.value)}
          required
        />
        <Button type="submit" disabled={configurar.isPending}>
          {configurar.isPending ? "Salvando..." : "Configurar pró-labore"}
        </Button>
      </form>
    </div>
  );
}

function PainelConfigurado({
  data,
}: {
  data: { valor?: string; diaPagamento?: number; parcelas?: DespesaGeral[] };
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const marcarPaga = useMarcarDespesaPaga();
  const marcarEmAberto = useMarcarDespesaEmAberto();
  const [actionError, setActionError] = useState<string | null>(null);

  const parcelas = data.parcelas ?? [];

  async function handleAlternarPagamento(parcela: DespesaGeral) {
    setActionError(null);
    try {
      if (parcela.pago) {
        await marcarEmAberto.mutateAsync(parcela.id);
      } else {
        await marcarPaga.mutateAsync(parcela.id);
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao atualizar pagamento");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">Valor mensal atual</p>
          <p className="text-2xl font-semibold text-slate-800">
            R$ {Number(data.valor).toFixed(2)}
            <span className="ml-2 text-sm font-normal text-slate-500">
              todo dia {data.diaPagamento}
            </span>
          </p>
        </div>
        <Button variant="secondary" onClick={() => setModalAberto(true)}>
          Alterar valor
        </Button>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      <Table
        rows={parcelas}
        keyField={(row) => row.id}
        emptyMessage="Nenhuma parcela lançada ainda."
        columns={[
          {
            header: "Mês",
            render: (row) => {
              const label = mesAnoPorExtenso(new Date(row.dataDespesa));
              return label.charAt(0).toUpperCase() + label.slice(1);
            },
          },
          { header: "Valor", render: (row) => `R$ ${Number(row.valor).toFixed(2)}` },
          {
            header: "Status",
            render: (row) =>
              row.pago ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Recebido
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
            render: (row) => (
              <button className="text-sm text-slate-600 hover:underline" onClick={() => handleAlternarPagamento(row)}>
                {row.pago ? "Marcar como em aberto" : "Marcar como recebido"}
              </button>
            ),
          },
        ]}
      />

      {modalAberto && (
        <AlterarValorModal valorAtual={data.valor ?? "0"} onClose={() => setModalAberto(false)} />
      )}
    </div>
  );
}

function AlterarValorModal({ valorAtual, onClose }: { valorAtual: string; onClose: () => void }) {
  const [valor, setValor] = useState(valorAtual);
  const [error, setError] = useState<string | null>(null);
  const atualizar = useAtualizarValorProLabore();

  const mesQueVem = mesAnoPorExtenso(proximoMes());

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await atualizar.mutateAsync({ valor: Number(valor) });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao alterar valor");
    }
  }

  return (
    <Modal title="Alterar valor do pró-labore" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          O novo valor passa a valer a partir de <strong>{mesQueVem}</strong>. As parcelas já
          lançadas até o mês atual continuam em R$ {Number(valorAtual).toFixed(2)}.
        </p>
        <Input
          label="Novo valor mensal (R$)"
          type="number"
          step="any"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={atualizar.isPending}>
            {atualizar.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
