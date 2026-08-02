import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Sprig } from "../components/Sprig";
import { ProductCard } from "../components/ProductCard";
import { Loading } from "../components/Loading";
import { useCatalogo } from "../hooks/useCatalogo";

const VALORES = [
  { titulo: "Artesanal", texto: "Cada peça feita à mão, em pequenos lotes." },
  { titulo: "Natural", texto: "Ingredientes de origem vegetal e mineral." },
  { titulo: "Ancestral", texto: "Rituais e saberes passados de geração em geração." },
  { titulo: "Sustentável", texto: "Produção consciente, do insumo à embalagem." },
  { titulo: "Feito com amor", texto: "Cada sabonete carrega intenção e cuidado." },
];

export function HomePage() {
  const { data: produtos, isLoading } = useCatalogo();
  const destaques = (produtos ?? []).slice(0, 4);

  return (
    <div>
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-brand-dark px-6 text-center">
        <Sprig className="pointer-events-none absolute -right-10 -top-10 h-[420px] w-auto rotate-12 text-brand-gold/10" />
        <Sprig className="pointer-events-none absolute -bottom-16 -left-10 h-[380px] w-auto -rotate-12 text-brand-gold/10" />

        <Logo size="lg" className="relative z-10" />

        <div className="relative z-10 mt-8 flex items-center gap-3 text-brand-gold">
          <span className="h-px w-10 bg-brand-gold/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
          <span className="h-px w-10 bg-brand-gold/60" />
        </div>

        <Link
          to="/catalogo"
          className="relative z-10 mt-8 rounded-full bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105"
        >
          Ver catálogo
        </Link>
      </section>

      <section className="bg-brand-cream px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-5">
          {VALORES.map((v) => (
            <div key={v.titulo} className="text-center">
              <h3 className="font-serif-brand text-lg text-brand-dark">{v.titulo}</h3>
              <p className="mt-1 text-xs text-brand-brown/70">{v.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-serif-brand text-3xl text-brand-dark">Produtos em destaque</h2>
            <Link to="/catalogo" className="text-sm font-medium text-brand-olive hover:text-brand-gold">
              Ver catálogo completo &rarr;
            </Link>
          </div>
          {isLoading && <Loading />}
          {!isLoading && destaques.length === 0 && (
            <p className="text-sm text-brand-brown/60">Em breve, novos produtos por aqui.</p>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {destaques.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
