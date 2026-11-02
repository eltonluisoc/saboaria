import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCatalogo, useProdutoPublico } from "../hooks/useCatalogo";
import { useCart } from "../context/CartContext";
import { Sprig } from "../components/Sprig";
import { Loading } from "../components/Loading";
import { ProductCard } from "../components/ProductCard";

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProdutoPage() {
  const { id } = useParams();
  const produtoId = Number(id);
  const { data: produto, isLoading, error } = useProdutoPublico(produtoId);
  const { data: catalogo } = useCatalogo();
  const { adicionar } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  if (isLoading) return <Loading />;

  if (error || !produto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-brand-brown/70">Produto não encontrado.</p>
        <Link to="/catalogo" className="mt-4 inline-block text-brand-olive hover:text-brand-gold">
          &larr; Voltar para o catálogo
        </Link>
      </div>
    );
  }

  function handleAdicionar() {
    adicionar(produto!.id, quantidade);
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 2000);
  }

  const relacionados = (catalogo ?? [])
    .filter((p) => p.id !== produto.id && p.categoria === produto.categoria && !p.emBreve)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link to="/catalogo" className="text-sm text-brand-olive hover:text-brand-gold">
        &larr; Voltar para o catálogo
      </Link>
      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-cream">
          {produto.imagemUrl ? (
            <img src={produto.imagemUrl} alt={produto.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-cream to-brand-olive/20">
              <Sprig className="h-32 w-auto text-brand-olive/50" />
            </div>
          )}
          {produto.emBreve && (
            <span className="absolute left-4 top-4 rounded-full bg-brand-dark px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Em breve
            </span>
          )}
          {produto.ehKit && (
            <span className="absolute right-4 top-4 rounded-full bg-brand-gold px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-dark">
              Kit
            </span>
          )}
          {!produto.emBreve && produto.maisVendido && (
            <span className="absolute left-4 top-4 rounded-full bg-brand-dark px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Mais vendido
            </span>
          )}
        </div>
        <div>
          <h1 className="font-serif-brand text-4xl text-brand-dark">{produto.nome}</h1>
          {!produto.emBreve && (
            <p className="mt-3 font-serif-brand text-2xl text-brand-gold">{formatarPreco(produto.precoVenda)}</p>
          )}
          {produto.descricao && <p className="mt-4 text-brand-brown/80">{produto.descricao}</p>}

          {produto.emBreve ? (
            <p className="mt-8 rounded-lg bg-brand-olive/10 px-4 py-3 text-sm text-brand-brown/80">
              Esse produto ainda não chegou — fique de olho que a novidade está a caminho.
            </p>
          ) : (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-brand-olive/30">
                <button
                  className="px-3 py-2 text-brand-brown hover:text-brand-gold"
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-8 text-center">{quantidade}</span>
                <button
                  className="px-3 py-2 text-brand-brown hover:text-brand-gold"
                  onClick={() => setQuantidade((q) => q + 1)}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdicionar}
                className="rounded-full bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105"
              >
                {adicionado ? "Adicionado!" : "Adicionar ao carrinho"}
              </button>
            </div>
          )}
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="mt-16 border-t border-brand-olive/15 pt-10">
          <h2 className="mb-6 font-serif-brand text-2xl text-brand-dark">Você também pode gostar</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relacionados.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
