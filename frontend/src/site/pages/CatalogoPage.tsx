import { ProductCard } from "../components/ProductCard";
import { Loading } from "../components/Loading";
import { useCatalogo } from "../hooks/useCatalogo";

export function CatalogoPage() {
  const { data: produtos, isLoading, error } = useCatalogo();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-serif-brand text-4xl text-brand-dark">Catálogo</h1>
        <p className="mt-2 text-sm text-brand-brown/70">Sabonetes e rituais de banho feitos à mão</p>
      </div>

      {isLoading && <Loading />}
      {error && <p className="text-center text-sm text-red-700">Não foi possível carregar o catálogo.</p>}
      {produtos && produtos.length === 0 && (
        <p className="text-center text-sm text-brand-brown/60">Em breve, novos produtos por aqui.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(produtos ?? []).map((produto) => (
          <ProductCard key={produto.id} produto={produto} />
        ))}
      </div>
    </div>
  );
}
