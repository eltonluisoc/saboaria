import { Link, NavLink, Outlet } from "react-router-dom";
import { Logo } from "./Logo";
import { useCart } from "../context/CartContext";

const VALORES = ["Artesanal", "Natural", "Ancestral", "Sustentável", "Feito com amor"];

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 8H6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="21" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteLayout() {
  const { totalItens } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream font-sans-brand text-brand-brown">
      <header className="sticky top-0 z-40 bg-brand-dark">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-brand-cream">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "text-brand-gold" : "hover:text-brand-gold")}>
              Início
            </NavLink>
            <NavLink
              to="/catalogo"
              className={({ isActive }) => (isActive ? "text-brand-gold" : "hover:text-brand-gold")}
            >
              Catálogo
            </NavLink>
            <Link to="/carrinho" className="relative flex items-center gap-1 hover:text-brand-gold">
              <CartIcon />
              {totalItens > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[10px] font-semibold text-brand-dark">
                  {totalItens}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-brand-brown px-6 py-10 text-brand-cream">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <Logo size="sm" />
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs uppercase tracking-widest text-brand-cream/70">
            {VALORES.map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
          <p className="text-xs text-brand-cream/50">© {new Date().getFullYear()} Lud&apos;E Saboaria Artesanal</p>
        </div>
      </footer>
    </div>
  );
}
