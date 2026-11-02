import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { Loading } from "../components/Loading";
import { useCatalogo } from "../hooks/useCatalogo";
import { useCart } from "../context/CartContext";

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CATEGORIAS = ["Sabonetes", "Casa", "Carro", "Corpo", "Kits"];

type Ordenacao = "relevancia" | "menor-preco" | "maior-preco";

export function CatalogoPage() {
  const { data: produtos, isLoading, error } = useCatalogo();
  const { itens, totalItens } = useCart();
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia");

  const produtosPorId = new Map((produtos ?? []).map((p) => [p.id, p]));
  const totalCarrinho = itens.reduce((soma, item) => {
    const produto = produtosPorId.get(item.produtoId);
    return soma + (produto ? Number(produto.precoVenda) * item.quantidade : 0);
  }, 0);

  const categoriasDisponiveis = CATEGORIAS.filter((c) => (produtos ?? []).some((p) => p.categoria === c));

  const produtosFiltrados = useMemo(() => {
    let lista = produtos ?? [];

    if (categoriaAtiva) {
      lista = lista.filter((p) => p.categoria === categoriaAtiva);
    }

    const termo = busca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter(
        (p) => p.nome.toLowerCase().includes(termo) || (p.descricao ?? "").toLowerCase().includes(termo)
      );
    }

    if (ordenacao === "menor-preco") {
      lista = [...lista].sort((a, b) => Number(a.precoVenda) - Number(b.precoVenda));
    } else if (ordenacao === "maior-preco") {
      lista = [...lista].sort((a, b) => Number(b.precoVenda) - Number(a.precoVenda));
    }

    return lista;
  }, [produtos, categoriaAtiva, busca, ordenacao]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 pb-28">
      <div className="mb-10 text-center">
        <h1 className="font-serif-brand text-4xl text-brand-dark">Catálogo</h1>
        <p className="mt-2 text-sm text-brand-brown/70">Rituais artesanais para o banho, a casa e o dia a dia</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full rounded-full border border-brand-olive/30 bg-white px-5 py-2.5 text-sm text-brand-brown outline-none focus:border-brand-gold sm:max-w-xs"
        />
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
          className="w-full rounded-full border border-brand-olive/30 bg-white px-4 py-2.5 text-sm text-brand-brown outline-none focus:border-brand-gold sm:w-auto"
        >
          <option value="relevancia">Relevância</option>
          <option value="menor-preco">Menor preço</option>
          <option value="maior-preco">Maior preço</option>
        </select>
      </div>

      {categoriasDisponiveis.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoriaAtiva(null)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              categoriaAtiva === null
                ? "border-brand-gold bg-brand-gold text-brand-dark"
                : "border-brand-olive/30 text-brand-brown hover:border-brand-gold"
            }`}
          >
            Todos
          </button>
          {categoriasDisponiveis.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategoriaAtiva(c)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                categoriaAtiva === c
                  ? "border-brand-gold bg-brand-gold text-brand-dark"
                  : "border-brand-olive/30 text-brand-brown hover:border-brand-gold"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {isLoading && <Loading />}
      {error && <p className="text-center text-sm text-red-700">Não foi possível carregar o catálogo.</p>}
      {produtos && produtos.length === 0 && (
        <p className="text-center text-sm text-brand-brown/60">Em breve, novos produtos por aqui.</p>
      )}
      {produtos && produtos.length > 0 && produtosFiltrados.length === 0 && (
        <p className="text-center text-sm text-brand-brown/60">Nenhum produto encontrado com esse filtro.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {produtosFiltrados.map((produto) => (
          <ProductCard key={produto.id} produto={produto} />
        ))}
      </div>

      {produtos && produtos.length > 0 && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-brand-olive/15 pt-8 text-xs uppercase tracking-wide text-brand-brown/60">
          <span>Pagamento seguro via Mercado Pago</span>
          <span>Produção 100% artesanal, feito à mão</span>
        </div>
      )}

      {totalItens > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-olive/20 bg-white/95 px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <span className="text-sm text-brand-brown">
              <strong className="text-brand-dark">{totalItens}</strong> {totalItens === 1 ? "item" : "itens"} ·{" "}
              <strong className="text-brand-dark">{formatarPreco(totalCarrinho)}</strong>
            </span>
            <Link
              to="/checkout"
              className="rounded-full bg-brand-gold px-8 py-3 text-xs font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105"
            >
              Finalizar compra
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
