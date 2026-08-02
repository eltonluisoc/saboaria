import { Link } from "react-router-dom";
import { Sprig } from "./Sprig";
import type { ProdutoPublico } from "../hooks/useCatalogo";

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductCard({ produto }: { produto: ProdutoPublico }) {
  return (
    <Link
      to={`/produto/${produto.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-brand-olive/20 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
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
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-serif-brand text-lg text-brand-dark">{produto.nome}</h3>
        {produto.descricao && <p className="line-clamp-2 text-sm text-brand-brown/70">{produto.descricao}</p>}
        <p className="mt-auto pt-2 font-serif-brand text-lg text-brand-gold">
          {formatarPreco(produto.precoVenda)}
        </p>
      </div>
    </Link>
  );
}
