import { useState } from "react";
import { Link } from "react-router-dom";
import { Sprig } from "./Sprig";
import { useCart } from "../context/CartContext";
import type { ProdutoPublico } from "../hooks/useCatalogo";

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductCard({ produto }: { produto: ProdutoPublico }) {
  const { adicionar } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  function handleAdicionar() {
    adicionar(produto.id, quantidade);
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1500);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-brand-olive/20 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/produto/${produto.id}`} className="flex flex-1 flex-col">
        <div className="aspect-square w-full overflow-hidden bg-brand-cream">
          {produto.imagemUrl ? (
            <img
              src={produto.imagemUrl}
              alt={produto.nome}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-cream to-brand-olive/20">
              <Sprig className="h-16 w-auto text-brand-olive/50" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4 pb-0">
          <h3 className="font-serif-brand text-lg text-brand-dark">{produto.nome}</h3>
          {produto.descricao && <p className="line-clamp-2 text-sm text-brand-brown/70">{produto.descricao}</p>}
          <p className="mt-auto pt-2 font-serif-brand text-lg text-brand-gold">
            {formatarPreco(produto.precoVenda)}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 p-4 pt-3">
        <div className="flex items-center rounded-full border border-brand-olive/30">
          <button
            type="button"
            className="px-2.5 py-1 text-brand-brown hover:text-brand-gold"
            onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span className="w-6 text-center text-sm">{quantidade}</span>
          <button
            type="button"
            className="px-2.5 py-1 text-brand-brown hover:text-brand-gold"
            onClick={() => setQuantidade((q) => q + 1)}
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdicionar}
          className="flex-1 rounded-full bg-brand-gold px-3 py-2 text-xs font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105"
        >
          {adicionado ? "Adicionado!" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}
