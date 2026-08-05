import { useState, type FormEvent } from "react";
import { useCriarLote, useLotes } from "../hooks/useLotes";
import { useProdutos } from "../hooks/useProdutos";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";

export function LotesPage() {
  const { data: lotes, isLoading, error } = useLotes();
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Lotes de Produção</h1>
          <p className="text-sm text-slate-500">
            Cada lote debita o estoque dos insumos da receita e credita o estoque do produto
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>Novo lote</Button>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Erro ao carregar lotes" />}

      {lotes && (
        <Table
          rows={lotes}
          keyField={(row) => row.id}
          emptyMessage="Nenhum lote registrado ainda"
          columns={[
            { header: "Produto", render: (row) => row.produto?.nome ?? `#${row.produtoId}` },
            { header: "Quantidade produzida", render: (row) => row.quantidadeProduzida },
            {
              header: "Data de produção",
              render: (row) => new Date(row.dataProducao).toLocaleDateString("pt-BR"),
            },
          ]}
        />
      )}

      {modalAberto && <LoteFormModal onClose={() => setModalAberto(false)} />}
    </div>
  );
}

function LoteFormModal({ onClose }: { onClose: () => void }) {
  const { data: produtos } = useProdutos();
  const [produtoId, setProdutoId] = useState("");
  const [quantidadeProduzida, setQuantidadeProduzida] = useState("");
  const [dataProducao, setDataProducao] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const criar = useCriarLote();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await criar.mutateAsync({
        produtoId: Number(produtoId),
        quantidadeProduzida: Number(quantidadeProduzida),
        dataProducao,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao registrar lote");
    }
  }

  return (
    <Modal title="Novo lote de produção" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Select label="Produto" value={produtoId} onChange={(e) => setProdutoId(e.target.value)} required>
          <option value="">Selecione...</option>
          {produtos?.map((produto) => (
            <option key={produto.id} value={produto.id}>
              {produto.nome}
            </option>
          ))}
        </Select>
        <Input
          label="Quantidade produzida"
          type="number"
          min="1"
          step="1"
          value={quantidadeProduzida}
          onChange={(e) => setQuantidadeProduzida(e.target.value)}
          required
        />
        <Input
          label="Data de produção"
          type="date"
          value={dataProducao}
          onChange={(e) => setDataProducao(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={criar.isPending}>
            {criar.isPending ? "Registrando..." : "Registrar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
