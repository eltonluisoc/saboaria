import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProdutoPublico } from "../hooks/useCatalogo";
import { useCart } from "../context/CartContext";
import { Sprig } from "../components/Sprig";
import { Loading } from "../components/Loading";

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProdutoPage() {
  const { id } = useParams();
  const produtoId = Number(id);
  const { data: produto, isLoading, error } = useProdutoPublico(produtoId);
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link to="/catalogo" className="text-sm text-brand-olive hover:text-brand-gold">
        &larr; Voltar para o catálogo
      </Link>
      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-brand-cream">
          {produto.imagemUrl ? (
            <img src={produto.imagemUrl} alt={produto.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-cream to-brand-olive/20">
              <Sprig className="h-32 w-auto text-brand-olive/50" />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-serif-brand text-4xl text-brand-dark">{produto.nome}</h1>
          <p className="mt-3 font-serif-brand text-2xl text-brand-gold">{formatarPreco(produto.precoVenda)}</p>
          {produto.descricao && <p className="mt-4 text-brand-brown/80">{produto.descricao}</p>}

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
        </div>
      </div>
    </div>
  );
}
