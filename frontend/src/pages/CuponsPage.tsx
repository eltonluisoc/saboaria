import { useState, type FormEvent } from "react";
import { useAlternarAtivoCupom, useCriarCupom, useCupons, useEditarCupom, type Cupom } from "../hooks/useCupons";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

export function CuponsPage() {
  const { data: cupons, isLoading, error } = useCupons();
  const [modalCupom, setModalCupom] = useState<Cupom | null | undefined>(undefined);
  const alternarAtivo = useAlternarAtivoCupom();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAlternarAtivo(cupom: Cupom) {
    setActionError(null);
    try {
      await alternarAtivo.mutateAsync(cupom.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao atualizar cupom");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Cupons de desconto</h1>
          <p className="text-sm text-slate-500">
            Códigos promocionais pro checkout do site — não acumulam com o 5% de cliente logado, vale o maior
          </p>
        </div>
        <Button onClick={() => setModalCupom(null)}>Novo cupom</Button>
      </div>

      {actionError && <ErrorBanner message={actionError} />}
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Erro ao carregar cupons" />}

      {cupons && (
        <Table
          rows={cupons}
          emptyMessage="Nenhum cupom cadastrado ainda."
          keyField={(c) => c.id}
          columns={[
            { header: "Código", render: (c) => <span className="font-mono font-medium">{c.codigo}</span> },
            { header: "Desconto", render: (c) => `${Number(c.percentualDesconto)}%` },
            {
              header: "Válido até",
              render: (c) => (c.validoAte ? new Date(c.validoAte).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "sem prazo"),
            },
            {
              header: "Uso",
              render: (c) => (c.usoMaximo ? `${c.vezesUsado} / ${c.usoMaximo}` : `${c.vezesUsado} (sem limite)`),
            },
            {
              header: "Status",
              render: (c) =>
                c.ativo ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Ativo
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    Inativo
                  </span>
                ),
            },
            {
              header: "Ações",
              render: (c) => (
                <div className="flex gap-3">
                  <button className="text-sm text-slate-600 hover:underline" onClick={() => setModalCupom(c)}>
                    Editar
                  </button>
                  <button className="text-sm text-slate-600 hover:underline" onClick={() => handleAlternarAtivo(c)}>
                    {c.ativo ? "Desativar" : "Ativar"}
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {modalCupom !== undefined && <CupomFormModal cupom={modalCupom} onClose={() => setModalCupom(undefined)} />}
    </div>
  );
}

function CupomFormModal({ cupom, onClose }: { cupom: Cupom | null; onClose: () => void }) {
  const [codigo, setCodigo] = useState(cupom?.codigo ?? "");
  const [percentualDesconto, setPercentualDesconto] = useState(cupom ? Number(cupom.percentualDesconto) : 10);
  const [validoAte, setValidoAte] = useState(cupom?.validoAte?.slice(0, 10) ?? "");
  const [usoMaximo, setUsoMaximo] = useState(cupom?.usoMaximo ? String(cupom.usoMaximo) : "");
  const [error, setError] = useState<string | null>(null);
  const criar = useCriarCupom();
  const editar = useEditarCupom(cupom?.id ?? 0);
  const salvando = criar.isPending || editar.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const dados = {
        percentualDesconto: Number(percentualDesconto),
        validoAte: validoAte || null,
        usoMaximo: usoMaximo ? Number(usoMaximo) : null,
      };
      if (cupom) {
        await editar.mutateAsync(dados);
      } else {
        await criar.mutateAsync({ codigo, ...dados });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar cupom");
    }
  }

  return (
    <Modal title={cupom ? "Editar cupom" : "Novo cupom"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Input
          label="Código"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          disabled={!!cupom}
          placeholder="ex: BEMVINDA10"
          required
        />
        <Input
          label="Desconto (%)"
          type="number"
          step="any"
          min="1"
          max="100"
          value={percentualDesconto}
          onChange={(e) => setPercentualDesconto(Number(e.target.value))}
          required
        />
        <Input
          label="Válido até (opcional)"
          type="date"
          value={validoAte}
          onChange={(e) => setValidoAte(e.target.value)}
        />
        <Input
          label="Limite de usos (opcional)"
          type="number"
          min="1"
          step="1"
          value={usoMaximo}
          onChange={(e) => setUsoMaximo(e.target.value)}
          placeholder="sem limite"
        />
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
