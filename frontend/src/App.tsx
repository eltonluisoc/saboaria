import { BrowserRouter, Route, Routes } from "react-router-dom";
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
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/insumos" element={<InsumosPage />} />
              <Route path="/insumos/:id" element={<InsumoDetailPage />} />
              <Route path="/produtos" element={<ProdutosPage />} />
              <Route path="/produtos/:id" element={<ProdutoDetailPage />} />
              <Route path="/despesas" element={<DespesasPage />} />
              <Route path="/vendas" element={<VendasPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
