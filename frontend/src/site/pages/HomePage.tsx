import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Sprig } from "../components/Sprig";
import { HomeProductTile } from "../components/HomeProductTile";
import { Loading } from "../components/Loading";
import { useCatalogo } from "../hooks/useCatalogo";

export function HomePage() {
  const { data: produtos, isLoading } = useCatalogo();
  const destaques = (produtos ?? []).slice(0, 4);

  return (
    <div>
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-brand-dark px-6 py-28 text-center sm:py-36">
        <Sprig className="pointer-events-none absolute -right-20 -top-16 h-[500px] w-auto rotate-[10deg] text-brand-gold/5" />

        <Logo size="lg" className="relative z-10" />

        <Link
          to="/catalogo"
          className="relative z-10 mt-12 rounded-full bg-brand-gold px-10 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-brand-dark transition-transform hover:scale-105"
        >
          Ver catálogo
        </Link>
      </section>

      <section className="px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex items-end justify-between gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">
                Coleção atual
              </span>
              <h2 className="mt-3 font-serif-brand text-4xl text-brand-dark">Produtos em destaque</h2>
            </div>
            <Link
              to="/catalogo"
              className="whitespace-nowrap text-sm font-medium text-brand-olive hover:text-brand-gold"
            >
              Ver catálogo completo &rarr;
            </Link>
          </div>
          {isLoading && <Loading />}
          {!isLoading && destaques.length === 0 && (
            <p className="text-sm text-brand-brown/60">Em breve, novos produtos por aqui.</p>
          )}
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {destaques.map((produto) => (
              <HomeProductTile key={produto.id} produto={produto} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
