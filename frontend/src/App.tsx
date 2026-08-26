import { lazy, Suspense } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { Spinner } from "./components/ui/Spinner";
import { CartProvider } from "./site/context/CartContext";
import { SiteLayout } from "./site/components/SiteLayout";
import { HomePage } from "./site/pages/HomePage";
import { CatalogoPage } from "./site/pages/CatalogoPage";
import { ProdutoPage } from "./site/pages/ProdutoPage";
import { CarrinhoPage } from "./site/pages/CarrinhoPage";
import { CheckoutPage } from "./site/pages/CheckoutPage";
import { CheckoutRetornoPage } from "./site/pages/CheckoutRetornoPage";
import { PedidoAcompanhamentoPage } from "./site/pages/PedidoAcompanhamentoPage";

// Paginas do admin carregam sob demanda - quem visita a loja nunca baixa
// esse codigo, so quem realmente acessa /admin.
const ProtectedLayout = lazy(() => import("./components/layout/ProtectedLayout").then((m) => ({ default: m.ProtectedLayout })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const InsumosPage = lazy(() => import("./pages/InsumosPage").then((m) => ({ default: m.InsumosPage })));
const InsumoDetailPage = lazy(() => import("./pages/InsumoDetailPage").then((m) => ({ default: m.InsumoDetailPage })));
const ProdutosPage = lazy(() => import("./pages/ProdutosPage").then((m) => ({ default: m.ProdutosPage })));
const ProdutoDetailPage = lazy(() => import("./pages/ProdutoDetailPage").then((m) => ({ default: m.ProdutoDetailPage })));
const DespesasPage = lazy(() => import("./pages/DespesasPage").then((m) => ({ default: m.DespesasPage })));
const PedidosPage = lazy(() => import("./pages/PedidosPage").then((m) => ({ default: m.PedidosPage })));
const PedidoDetailPage = lazy(() => import("./pages/PedidoDetailPage").then((m) => ({ default: m.PedidoDetailPage })));
const LotesPage = lazy(() => import("./pages/LotesPage").then((m) => ({ default: m.LotesPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner label="Carregando..." />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CartProvider>
          <Routes>
            {/* site público */}
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalogo" element={<CatalogoPage />} />
              <Route path="/produto/:id" element={<ProdutoPage />} />
              <Route path="/carrinho" element={<CarrinhoPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/retorno" element={<CheckoutRetornoPage />} />
              <Route path="/pedido/:codigoAcesso" element={<PedidoAcompanhamentoPage />} />
            </Route>

            {/* painel admin */}
            <Route
              path="/admin"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AuthProvider>
                    <Outlet />
                  </AuthProvider>
                </Suspense>
              }
            >
              <Route path="login" element={<LoginPage />} />
              <Route element={<ProtectedLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="insumos" element={<InsumosPage />} />
                <Route path="insumos/:id" element={<InsumoDetailPage />} />
                <Route path="produtos" element={<ProdutosPage />} />
                <Route path="produtos/:id" element={<ProdutoDetailPage />} />
                <Route path="despesas" element={<DespesasPage />} />
                <Route path="pedidos" element={<PedidosPage />} />
                <Route path="pedidos/:id" element={<PedidoDetailPage />} />
                <Route path="lotes" element={<LotesPage />} />
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
