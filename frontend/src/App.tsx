import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InsumosPage } from "./pages/InsumosPage";
import { InsumoDetailPage } from "./pages/InsumoDetailPage";
import { ProdutosPage } from "./pages/ProdutosPage";
import { ProdutoDetailPage } from "./pages/ProdutoDetailPage";
import { DespesasPage } from "./pages/DespesasPage";
import { VendasPage } from "./pages/VendasPage";
import { PedidosPage } from "./pages/PedidosPage";
import { PedidoDetailPage } from "./pages/PedidoDetailPage";
import { CartProvider } from "./site/context/CartContext";
import { SiteLayout } from "./site/components/SiteLayout";
import { HomePage } from "./site/pages/HomePage";
import { CatalogoPage } from "./site/pages/CatalogoPage";
import { ProdutoPage } from "./site/pages/ProdutoPage";
import { CarrinhoPage } from "./site/pages/CarrinhoPage";
import { CheckoutPage } from "./site/pages/CheckoutPage";
import { CheckoutRetornoPage } from "./site/pages/CheckoutRetornoPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

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
            </Route>

            {/* painel admin */}
            <Route
              path="/admin"
              element={
                <AuthProvider>
                  <Outlet />
                </AuthProvider>
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
                <Route path="vendas" element={<VendasPage />} />
                <Route path="pedidos" element={<PedidosPage />} />
                <Route path="pedidos/:id" element={<PedidoDetailPage />} />
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
