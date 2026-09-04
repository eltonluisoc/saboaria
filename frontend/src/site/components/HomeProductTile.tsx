import { Link } from "react-router-dom";
import { Sprig } from "./Sprig";
import type { ProdutoPublico } from "../hooks/useCatalogo";

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Vitrine sem moldura pra Home: a foto respira sozinha, sombra só some
// no hover — usado apenas aqui, o Catálogo continua com o ProductCard
// (com moldura) como está hoje.
export function HomeProductTile({ produto }: { produto: ProdutoPublico }) {
  return (
    <Link to={`/produto/${produto.id}`} className="group flex flex-col">
      <div className="aspect-square w-full overflow-hidden rounded-md bg-brand-cream shadow-none transition-shadow duration-300 group-hover:shadow-[0_28px_52px_-26px_rgba(46,53,36,0.22)]">
        {produto.imagemUrl ? (
          <img
            src={produto.imagemUrl}
            alt={produto.nome}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-cream to-brand-olive/20">
            <Sprig className="h-16 w-auto text-brand-olive/50" />
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-1.5">
        <h3 className="font-serif-brand text-lg text-brand-dark">{produto.nome}</h3>
        {produto.descricao && (
          <p className="line-clamp-2 text-sm text-brand-brown/65">{produto.descricao}</p>
        )}
        <p className="mt-1.5 font-serif-brand text-lg text-brand-gold">{formatarPreco(produto.precoVenda)}</p>
      </div>
    </Link>
  );
}
