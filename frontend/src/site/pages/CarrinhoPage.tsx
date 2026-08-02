import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCatalogo, type ProdutoPublico } from "../hooks/useCatalogo";
import { Sprig } from "../components/Sprig";
import { Loading } from "../components/Loading";

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CarrinhoPage() {
  const { itens, atualizarQuantidade, remover } = useCart();
  const { data: produtos, isLoading } = useCatalogo();

  if (isLoading) return <Loading />;

  const produtosPorId = new Map((produtos ?? []).map((p) => [p.id, p]));
  const linhas: { quantidade: number; produto: ProdutoPublico }[] = [];
  for (const item of itens) {
    const produto = produtosPorId.get(item.produtoId);
    if (produto) linhas.push({ quantidade: item.quantidade, produto });
  }

  const total = linhas.reduce((soma, l) => soma + Number(l.produto.precoVenda) * l.quantidade, 0);
  const indisponiveis = itens.length - linhas.length;

  if (linhas.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <Sprig className="mx-auto h-16 w-auto text-brand-olive/40" />
        <h1 className="mt-4 font-serif-brand text-3xl text-brand-dark">Seu carrinho está vazio</h1>
        <Link
          to="/catalogo"
          className="mt-6 inline-block rounded-full bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-dark"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif-brand text-3xl text-brand-dark">Seu carrinho</h1>

      {indisponiveis > 0 && (
        <p className="mt-4 rounded-md bg-brand-olive/10 px-4 py-2 text-sm text-brand-brown">
          {indisponiveis} item(ns) do seu carrinho não está(ão) mais disponível(is) e foi(ram) removido(s).
        </p>
      )}

      <div className="mt-8 divide-y divide-brand-olive/20">
        {linhas.map(({ quantidade, produto }) => (
          <div key={produto.id} className="flex items-center gap-4 py-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-brand-cream">
              {produto.imagemUrl ? (
                <img src={produto.imagemUrl} alt={produto.nome} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-cream to-brand-olive/20">
                  <Sprig className="h-8 w-auto text-brand-olive/50" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Link
                to={`/produto/${produto.id}`}
                className="font-serif-brand text-lg text-brand-dark hover:text-brand-gold"
              >
                {produto.nome}
              </Link>
              <p className="text-sm text-brand-brown/70">{formatarPreco(Number(produto.precoVenda))}</p>
            </div>
            <div className="flex items-center rounded-full border border-brand-olive/30">
              <button
                className="px-3 py-1 text-brand-brown hover:text-brand-gold"
                onClick={() => atualizarQuantidade(produto.id, quantidade - 1)}
              >
                −
              </button>
              <span className="w-8 text-center">{quantidade}</span>
              <button
                className="px-3 py-1 text-brand-brown hover:text-brand-gold"
                onClick={() => atualizarQuantidade(produto.id, quantidade + 1)}
              >
                +
              </button>
            </div>
            <p className="w-24 text-right font-medium text-brand-dark">
              {formatarPreco(Number(produto.precoVenda) * quantidade)}
            </p>
            <button onClick={() => remover(produto.id)} className="text-sm text-red-700/70 hover:text-red-700">
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-brand-olive/20 pt-6">
        <span className="font-serif-brand text-2xl text-brand-dark">Total: {formatarPreco(total)}</span>
        <Link
          to="/checkout"
          className="rounded-full bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105"
        >
          Finalizar compra
        </Link>
      </div>
    </div>
  );
}
