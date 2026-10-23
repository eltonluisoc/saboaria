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
  const [produtoDetalhes, setProdutoDetalhes] = useState<Produto | null>(null);
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
                <Link to={`/admin/produtos/${row.id}`} className="font-medium text-emerald-700 hover:underline">
                  {row.nome}
                </Link>
              ),
            },
            { header: "Preço de venda", render: (row) => `R$ ${Number(row.precoVenda).toFixed(2)}` },
            {
              header: "Margem",
              render: (row) => {
                const margemReal = Number(row.precoVenda) - row.custoUnitarioCompleto;
                return (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${margemReal >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      R$ {margemReal.toFixed(2)}
                    </span>
                    <button
                      className="text-xs text-slate-400 hover:text-slate-600 hover:underline"
                      onClick={() => setProdutoDetalhes(row)}
                    >
                      detalhes
                    </button>
                  </div>
                );
              },
            },
            { header: "Estoque", render: (row) => row.estoqueAtual },
            {
              header: "Status",
              render: (row) => (
                <div className="flex flex-wrap gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {row.ativo ? "Ativo" : "Inativo"}
                  </span>
                  {row.emBreve && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Em breve
                    </span>
                  )}
                  {row.ehKit && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                      Kit
                    </span>
                  )}
                </div>
              ),
            },
            {
              header: "Ações",
              render: (row) => (
                <div className="flex gap-3">
                  <Link to={`/admin/produtos/${row.id}`} className="text-sm text-emerald-700 hover:underline">
                    {row.ehKit ? "Composição" : "Receita"}
                  </Link>
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

      {produtoDetalhes && (
        <DetalhesCustoModal produto={produtoDetalhes} onClose={() => setProdutoDetalhes(null)} />
      )}
    </div>
  );
}

function DetalhesCustoModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const margemInsumos = Number(produto.precoVenda) - Number(produto.custoMedio);
  const margemReal = Number(produto.precoVenda) - produto.custoUnitarioCompleto;

  return (
    <Modal title={`Detalhes de custo — ${produto.nome}`} onClose={onClose}>
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <dt className="text-slate-500">Custo médio (insumos)</dt>
          <dd className="font-medium text-slate-800">R$ {Number(produto.custoMedio).toFixed(2)}</dd>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <dt className="text-slate-500">Custo completo (c/ rateio)</dt>
          <dd className="font-medium text-slate-800">R$ {produto.custoUnitarioCompleto.toFixed(2)}</dd>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <dt className="text-slate-500">Margem (insumos)</dt>
          <dd className={margemInsumos >= 0 ? "font-medium text-emerald-700" : "font-medium text-red-700"}>
            R$ {margemInsumos.toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Margem real (c/ rateio)</dt>
          <dd className={margemReal >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
            R$ {margemReal.toFixed(2)}
          </dd>
        </div>
      </dl>
    </Modal>
  );
}

function ProdutoFormModal({ produto, onClose }: { produto: Produto | null; onClose: () => void }) {
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [imagemUrl, setImagemUrl] = useState(produto?.imagemUrl ?? "");
  const [precoVenda, setPrecoVenda] = useState(produto?.precoVenda ?? "");
  const [pesoUnidadeGramas, setPesoUnidadeGramas] = useState(produto?.pesoUnidadeGramas ?? "");
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [emBreve, setEmBreve] = useState(produto?.emBreve ?? false);
  const [ehKit, setEhKit] = useState(produto?.ehKit ?? false);
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
        imagemUrl: imagemUrl || null,
        precoVenda: Number(precoVenda),
        pesoUnidadeGramas: pesoUnidadeGramas ? Number(pesoUnidadeGramas) : null,
        ativo,
        emBreve,
        ehKit,
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
          label="URL da imagem (opcional)"
          placeholder="/produtos/nome-do-arquivo.jpg"
          value={imagemUrl ?? ""}
          onChange={(e) => setImagemUrl(e.target.value)}
        />
        <p className="-mt-2 text-xs text-slate-500">
          As imagens ficam guardadas dentro do próprio site (carregam mais rápido e com cache
          correto). Pra adicionar uma foto nova, é só pedir — ela é publicada junto com o site e o
          caminho (ex: /produtos/novo-sabonete.jpg) entra aqui.
        </p>
        <Input
          label="Preço de venda (R$)"
          type="number"
          step="any"
          min="0"
          value={precoVenda}
          onChange={(e) => setPrecoVenda(e.target.value)}
          required
        />
        <Input
          label="Peso por unidade (g)"
          type="number"
          step="any"
          min="0"
          value={pesoUnidadeGramas}
          onChange={(e) => setPesoUnidadeGramas(e.target.value)}
        />
        <p className="-mt-2 text-xs text-slate-500">
          Necessário antes de cadastrar a receita — a receita é definida por kg de massa, e o
          peso da unidade converte isso pro custo por sabonete. Trocar de molde é só atualizar
          esse peso, sem mexer na receita.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativo (visível no site quando o catálogo existir)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={emBreve} onChange={(e) => setEmBreve(e.target.checked)} />
          Em breve (aparece no catálogo, mas sem botão de comprar)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={ehKit} onChange={(e) => setEhKit(e.target.checked)} />
          É um kit (composto por outros produtos — gerencie a composição na tela do produto)
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
