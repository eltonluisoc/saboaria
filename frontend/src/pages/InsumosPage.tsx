import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCriarInsumo, useEditarInsumo, useInsumos, useRemoverInsumo } from "../hooks/useInsumos";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";
import type { Insumo } from "../types";

export function InsumosPage() {
  const { data: insumos, isLoading, error } = useInsumos();
  const [modalInsumo, setModalInsumo] = useState<Insumo | null | undefined>(undefined);
  const remover = useRemoverInsumo();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleRemover(insumo: Insumo) {
    if (!confirm(`Remover o insumo "${insumo.nome}"?`)) return;
    setActionError(null);
    try {
      await remover.mutateAsync({ id: insumo.id });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.data && typeof err.data === "object") {
        const { compras, produtos } = err.data as { compras?: number; produtos?: string[] };
        if (compras !== undefined && produtos !== undefined) {
          const listaProdutos = produtos.length > 0 ? produtos.join(", ") : "nenhum produto";
          const confirmarCascata = confirm(
            `Esse insumo tem ${compras} compra(s) registrada(s) e é usado na receita de: ${listaProdutos}.\n\n` +
              "Excluir o insumo E todo esse histórico (compras + linhas de receita nesses produtos)?"
          );
          if (confirmarCascata) {
            try {
              await remover.mutateAsync({ id: insumo.id, cascata: true });
            } catch (err2) {
              setActionError(err2 instanceof ApiError ? err2.message : "Erro ao remover insumo");
            }
          }
          return;
        }
      }
      setActionError(err instanceof ApiError ? err.message : "Erro ao remover insumo");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Insumos</h1>
          <p className="text-sm text-slate-500">Custo unitário calculado pela média ponderada das compras</p>
        </div>
        <Button onClick={() => setModalInsumo(null)}>Novo insumo</Button>
      </div>

      {actionError && <ErrorBanner message={actionError} />}
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Erro ao carregar insumos" />}

      {insumos && (
        <Table
          rows={insumos}
          keyField={(row) => row.id}
          columns={[
            {
              header: "Nome",
              render: (row) => (
                <Link to={`/admin/insumos/${row.id}`} className="font-medium text-emerald-700 hover:underline">
                  {row.nome}
                </Link>
              ),
            },
            { header: "Unidade", render: (row) => row.unidadeMedida },
            {
              header: "Custo unitário atual",
              render: (row) => `R$ ${Number(row.custoUnitarioAtual).toFixed(4)}`,
            },
            {
              header: "Estoque atual",
              render: (row) => `${Number(row.estoqueAtual)} ${row.unidadeMedida}`,
            },
            {
              header: "Ações",
              render: (row) => (
                <div className="flex gap-3">
                  <Link to={`/admin/insumos/${row.id}`} className="text-sm text-emerald-700 hover:underline">
                    Comprar
                  </Link>
                  <button className="text-sm text-slate-600 hover:underline" onClick={() => setModalInsumo(row)}>
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

      {modalInsumo !== undefined && (
        <InsumoFormModal insumo={modalInsumo} onClose={() => setModalInsumo(undefined)} />
      )}
    </div>
  );
}

function InsumoFormModal({ insumo, onClose }: { insumo: Insumo | null; onClose: () => void }) {
  const [nome, setNome] = useState(insumo?.nome ?? "");
  const [unidadeMedida, setUnidadeMedida] = useState(insumo?.unidadeMedida ?? "");
  const [quantidadeInicial, setQuantidadeInicial] = useState("");
  const [precoUnitarioInicial, setPrecoUnitarioInicial] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState(insumo?.estoqueMinimo ?? "");
  const [error, setError] = useState<string | null>(null);
  const criar = useCriarInsumo();
  const editar = useEditarInsumo(insumo?.id ?? 0);
  const salvando = criar.isPending || editar.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (insumo) {
        await editar.mutateAsync({
          nome,
          unidadeMedida,
          estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : null,
        });
      } else {
        await criar.mutateAsync({
          nome,
          unidadeMedida,
          quantidadeInicial: quantidadeInicial ? Number(quantidadeInicial) : undefined,
          precoUnitarioInicial: precoUnitarioInicial ? Number(precoUnitarioInicial) : undefined,
          estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : null,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar insumo");
    }
  }

  return (
    <Modal title={insumo ? "Editar insumo" : "Novo insumo"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input
          label="Unidade de medida (ex: ml, g, un)"
          value={unidadeMedida}
          onChange={(e) => setUnidadeMedida(e.target.value)}
          required
        />
        <Input
          label="Estoque mínimo (alerta, opcional)"
          type="number"
          step="any"
          min="0"
          value={estoqueMinimo}
          onChange={(e) => setEstoqueMinimo(e.target.value)}
        />
        {!insumo && (
          <>
            <p className="text-xs text-slate-500">
              Opcional: já registra a primeira compra deste insumo, sem precisar editar depois.
            </p>
            <Input
              label="Quantidade inicial comprada (opcional)"
              type="number"
              step="any"
              min="0"
              value={quantidadeInicial}
              onChange={(e) => setQuantidadeInicial(e.target.value)}
            />
            <Input
              label="Preço unitário (R$, opcional)"
              type="number"
              step="any"
              min="0"
              value={precoUnitarioInicial}
              onChange={(e) => setPrecoUnitarioInicial(e.target.value)}
            />
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
