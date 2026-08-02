import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/Spinner";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/insumos", label: "Insumos" },
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/despesas", label: "Despesas" },
  { to: "/admin/vendas", label: "Vendas" },
];

export function ProtectedLayout() {
  const { admin, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner label="Verificando sessao..." />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <p className="text-lg font-semibold text-emerald-700">Saboraria</p>
          <p className="text-xs text-slate-500">Painel admin</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <p className="mb-2 truncate text-xs text-slate-500">{admin.email}</p>
          <button
            onClick={() => logout()}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
