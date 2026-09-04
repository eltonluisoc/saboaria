import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Sprig } from "../components/Sprig";
import { HomeProductTile } from "../components/HomeProductTile";
import { IngredienteDestaque } from "../components/IngredienteDestaque";
import { Loading } from "../components/Loading";
import { Reveal } from "../components/Reveal";
import { useCatalogo } from "../hooks/useCatalogo";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Hero já está acima da dobra no load — não faz sentido "revelar ao rolar",
// então essa entrada dispara sozinha no mount (fade + leve slide-up).
function useMountReveal() {
  const [mounted, setMounted] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (mounted) return;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  return mounted;
}

// Parallax leve na marca-d'água do Sprig no hero: translateY em função do
// scroll, sempre via transform (compositor-only, sem CLS).
function useHeroParallax() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const node = ref.current;
    if (!node) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const offset = Math.min(window.scrollY, 600) * 0.12;
      node.style.transform = `translateY(${offset}px) scale(${1 + offset / 2400})`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return ref;
}

export function HomePage() {
  const { data: produtos, isLoading } = useCatalogo();
  const destaques = (produtos ?? []).slice(0, 4);
  const mounted = useMountReveal();
  const parallaxRef = useHeroParallax();

  return (
    <div>
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-brand-dark px-6 py-14 text-center sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 35%, color-mix(in srgb, var(--color-brand-olive) 18%, transparent), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div ref={parallaxRef} className="pointer-events-none absolute -right-14 -top-8 will-change-transform">
          <Sprig className="h-[240px] w-auto rotate-[10deg] text-brand-gold/5" />
        </div>

        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-700 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Logo size="lg" />
        </div>

        <Link
          to="/catalogo"
          className={`relative z-10 mt-7 rounded-full bg-brand-gold px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark transition-all duration-700 ease-out hover:scale-105 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: mounted ? "150ms" : "0ms" }}
        >
          Ver catálogo
        </Link>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-10 flex items-end justify-between gap-6">
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
          </Reveal>
          {isLoading && <Loading />}
          {!isLoading && destaques.length === 0 && (
            <p className="text-sm text-brand-brown/60">Em breve, novos produtos por aqui.</p>
          )}
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {destaques.map((produto, i) => (
              <Reveal key={produto.id} delay={i * 100}>
                <HomeProductTile produto={produto} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <IngredienteDestaque />
    </div>
  );
}
