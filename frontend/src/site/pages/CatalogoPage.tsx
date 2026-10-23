import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { Loading } from "../components/Loading";
import { useCatalogo } from "../hooks/useCatalogo";
import { useCart } from "../context/CartContext";

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CatalogoPage() {
  const { data: produtos, isLoading, error } = useCatalogo();
  const { itens, totalItens } = useCart();

  const produtosPorId = new Map((produtos ?? []).map((p) => [p.id, p]));
  const totalCarrinho = itens.reduce((soma, item) => {
    const produto = produtosPorId.get(item.produtoId);
    return soma + (produto ? Number(produto.precoVenda) * item.quantidade : 0);
  }, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 pb-28">
      <div className="mb-10 text-center">
        <h1 className="font-serif-brand text-4xl text-brand-dark">Catálogo</h1>
        <p className="mt-2 text-sm text-brand-brown/70">Rituais artesanais para o banho, a casa e o dia a dia</p>
      </div>

      {isLoading && <Loading />}
      {error && <p className="text-center text-sm text-red-700">Não foi possível carregar o catálogo.</p>}
      {produtos && produtos.length === 0 && (
        <p className="text-center text-sm text-brand-brown/60">Em breve, novos produtos por aqui.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(produtos ?? []).map((produto) => (
          <ProductCard key={produto.id} produto={produto} />
        ))}
      </div>

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
