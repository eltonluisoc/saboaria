import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useComprasInsumo,
  useEditarCompra,
  useInsumo,
  useRegistrarCompra,
  useRemoverCompra,
} from "../hooks/useInsumos";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";
import type { CompraInsumo } from "../types";

export function InsumoDetailPage() {
  const { id } = useParams();
  const insumoId = Number(id);
  const { data: insumo, isLoading: loadingInsumo } = useInsumo(insumoId);
  const { data: compras, isLoading: loadingCompras } = useComprasInsumo(insumoId);
  const registrarCompra = useRegistrarCompra(insumoId);
  const removerCompra = useRemoverCompra(insumoId);

  const [quantidade, setQuantidade] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [dataCompra, setDataCompra] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [modalCompra, setModalCompra] = useState<CompraInsumo | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await registrarCompra.mutateAsync({
        quantidade: Number(quantidade),
        precoUnitario: Number(precoUnitario),
        dataCompra,
      });
      setQuantidade("");
      setPrecoUnitario("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao registrar compra");
    }
  }

  async function handleRemoverCompra(compra: CompraInsumo) {
    if (!confirm(`Remover essa compra de ${Number(compra.quantidade)} ${insumo?.unidadeMedida ?? ""}?`)) return;
    setActionError(null);
    try {
      await removerCompra.mutateAsync(compra.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao remover compra");
    }
  }

  if (loadingInsumo) return <Spinner />;
  if (!insumo) return <ErrorBanner message="Insumo nao encontrado" />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/insumos" className="text-sm text-emerald-700 hover:underline">
          &larr; Voltar para insumos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-800">{insumo.nome}</h1>
        <p className="text-sm text-slate-500">
          Unidade: {insumo.unidadeMedida} · Custo unitário atual:{" "}
          <span className="font-medium text-slate-700">R$ {Number(insumo.custoUnitarioAtual).toFixed(4)}</span>
          {" "}· Estoque atual:{" "}
          <span className="font-medium text-slate-700">
            {Number(insumo.estoqueAtual)} {insumo.unidadeMedida}
          </span>
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-800">Registrar nova compra</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
          {error && (
            <div className="sm:col-span-4">
              <ErrorBanner message={error} />
            </div>
          )}
          <Input
            label={`Quantidade (${insumo.unidadeMedida})`}
            type="number"
            step="any"
            min="0"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
          />
          <Input
            label="Preço unitário (R$)"
            type="number"
            step="any"
            min="0"
            value={precoUnitario}
            onChange={(e) => setPrecoUnitario(e.target.value)}
            required
          />
          <Input
            label="Data da compra"
            type="date"
            value={dataCompra}
            onChange={(e) => setDataCompra(e.target.value)}
            required
          />
          <Button type="submit" disabled={registrarCompra.isPending}>
            {registrarCompra.isPending ? "Registrando..." : "Registrar compra"}
          </Button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-800">Histórico de compras</h2>
        {actionError && (
          <div className="mb-3">
            <ErrorBanner message={actionError} />
          </div>
        )}
        {loadingCompras && <Spinner />}
        {compras && (
          <Table
            rows={compras}
            keyField={(row) => row.id}
            columns={[
              {
                header: "Data",
                render: (row) => new Date(row.dataCompra).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
              },
              { header: "Quantidade", render: (row) => Number(row.quantidade).toString() },
              { header: "Preço unitário", render: (row) => `R$ ${Number(row.precoUnitario).toFixed(4)}` },
              {
                header: "Valor total",
                render: (row) => `R$ ${(Number(row.quantidade) * Number(row.precoUnitario)).toFixed(2)}`,
              },
              {
                header: "Ações",
                render: (row) => (
                  <div className="flex gap-3">
                    <button className="text-sm text-slate-600 hover:underline" onClick={() => setModalCompra(row)}>
                      Editar
                    </button>
                    <button
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => handleRemoverCompra(row)}
                    >
                      Remover
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      {modalCompra !== undefined && (
        <CompraFormModal
          insumoId={insumoId}
          compra={modalCompra}
          unidadeMedida={insumo.unidadeMedida}
          onClose={() => setModalCompra(undefined)}
        />
      )}
    </div>
  );
}

function CompraFormModal({
  insumoId,
  compra,
  unidadeMedida,
  onClose,
}: {
  insumoId: number;
  compra: CompraInsumo;
  unidadeMedida: string;
  onClose: () => void;
}) {
  const [quantidade, setQuantidade] = useState(compra.quantidade);
  const [precoUnitario, setPrecoUnitario] = useState(compra.precoUnitario);
  const [dataCompra, setDataCompra] = useState(compra.dataCompra.slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const editarCompra = useEditarCompra(insumoId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await editarCompra.mutateAsync({
        compraId: compra.id,
        data: {
          quantidade: Number(quantidade),
          precoUnitario: Number(precoUnitario),
          dataCompra,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar compra");
    }
  }

  return (
    <Modal title="Editar compra" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Input
          label={`Quantidade (${unidadeMedida})`}
          type="number"
          step="any"
          min="0"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          required
        />
        <Input
          label="Preço unitário (R$)"
          type="number"
          step="any"
          min="0"
          value={precoUnitario}
          onChange={(e) => setPrecoUnitario(e.target.value)}
          required
        />
        <Input
          label="Data da compra"
          type="date"
          value={dataCompra}
          onChange={(e) => setDataCompra(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={editarCompra.isPending}>
            {editarCompra.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
