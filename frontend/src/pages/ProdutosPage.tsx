import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCriarProduto, useEditarProduto, useProdutos, useRemoverProduto } from "../hooks/useProdutos";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table } from "../components/ui/Table";
import { Spinner, ErrorBanner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";
import type { Produto } from "../types";

export function ProdutosPage() {
  const { data: produtos, isLoading, error } = useProdutos();
  const [modalProduto, setModalProduto] = useState<Produto | null | undefined>(undefined);
  const remover = useRemoverProduto();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleRemover(produto: Produto) {
    if (!confirm(`Remover o produto "${produto.nome}"?`)) return;
    setActionError(null);
    try {
      await remover.mutateAsync(produto.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erro ao remover produto");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Produtos</h1>
          <p className="text-sm text-slate-500">Custo médio calculado a partir da receita de cada produto</p>
        </div>
        <Button onClick={() => setModalProduto(null)}>Novo produto</Button>
      </div>

      {actionError && <ErrorBanner message={actionError} />}
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Erro ao carregar produtos" />}

      {produtos && (
        <Table
          rows={produtos}
          keyField={(row) => row.id}
          columns={[
            {
              header: "Nome",
              render: (row) => (
                <Link to={`/produtos/${row.id}`} className="font-medium text-emerald-700 hover:underline">
                  {row.nome}
                </Link>
              ),
            },
            { header: "Preço de venda", render: (row) => `R$ ${Number(row.precoVenda).toFixed(2)}` },
            { header: "Custo médio", render: (row) => `R$ ${Number(row.custoMedio).toFixed(2)}` },
            {
              header: "Margem",
              render: (row) => {
                const margem = Number(row.precoVenda) - Number(row.custoMedio);
                return (
                  <span className={margem >= 0 ? "text-emerald-700" : "text-red-700"}>
                    R$ {margem.toFixed(2)}
                  </span>
                );
              },
            },
            {
              header: "Status",
              render: (row) => (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {row.ativo ? "Ativo" : "Inativo"}
                </span>
              ),
            },
            {
              header: "Ações",
              render: (row) => (
                <div className="flex gap-3">
                  <button className="text-sm text-slate-600 hover:underline" onClick={() => setModalProduto(row)}>
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

      {modalProduto !== undefined && (
        <ProdutoFormModal produto={modalProduto} onClose={() => setModalProduto(undefined)} />
      )}
    </div>
  );
}

function ProdutoFormModal({ produto, onClose }: { produto: Produto | null; onClose: () => void }) {
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [precoVenda, setPrecoVenda] = useState(produto?.precoVenda ?? "");
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [error, setError] = useState<string | null>(null);
  const criar = useCriarProduto();
  const editar = useEditarProduto(produto?.id ?? 0);
  const salvando = criar.isPending || editar.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const dados = {
        nome,
        descricao: descricao || null,
        precoVenda: Number(precoVenda),
        ativo,
      };
      if (produto) {
        await editar.mutateAsync(dados);
      } else {
        await criar.mutateAsync(dados);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar produto");
    }
  }

  return (
    <Modal title={produto ? "Editar produto" : "Novo produto"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input
          label="Descrição (opcional)"
          value={descricao ?? ""}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <Input
          label="Preço de venda (R$)"
          type="number"
          step="any"
          min="0"
          value={precoVenda}
          onChange={(e) => setPrecoVenda(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativo (visível no site quando o catálogo existir)
        </label>
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
