import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCatalogo, type ProdutoPublico } from "../hooks/useCatalogo";
import { useCriarCheckout, useFreteFixo } from "../hooks/useCheckout";
import { Loading } from "../components/Loading";
import { ApiError } from "../../lib/api";

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CheckoutPage() {
  const { itens } = useCart();
  const { data: produtos, isLoading } = useCatalogo();
  const { data: freteInfo, isLoading: isLoadingFrete } = useFreteFixo();
  const criarCheckout = useCriarCheckout();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  if (isLoading || isLoadingFrete) return <Loading />;

  const produtosPorId = new Map((produtos ?? []).map((p) => [p.id, p]));
  const linhas: { quantidade: number; produto: ProdutoPublico }[] = [];
  for (const item of itens) {
    const produto = produtosPorId.get(item.produtoId);
    if (produto) linhas.push({ quantidade: item.quantidade, produto });
  }
  const subtotalProdutos = linhas.reduce((soma, l) => soma + Number(l.produto.precoVenda) * l.quantidade, 0);
  const frete = freteInfo?.valorFrete ?? 0;
  const total = subtotalProdutos + frete;

  if (linhas.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif-brand text-3xl text-brand-dark">Seu carrinho está vazio</h1>
        <Link to="/catalogo" className="mt-6 inline-block text-brand-olive hover:text-brand-gold">
          Ver catálogo
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      const resultado = await criarCheckout.mutateAsync({
        itens: itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
        cliente: { nome, email, telefone: telefone || undefined, endereco },
      });
      window.location.href = resultado.checkoutUrl;
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao iniciar o pagamento");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-serif-brand text-3xl text-brand-dark">Finalizar compra</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-4 font-serif-brand text-xl text-brand-dark">Seus dados</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>
            )}
            <input
              className="w-full rounded-md border border-brand-olive/30 bg-white px-4 py-2 text-sm text-brand-brown outline-none focus:border-brand-gold"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border border-brand-olive/30 bg-white px-4 py-2 text-sm text-brand-brown outline-none focus:border-brand-gold"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border border-brand-olive/30 bg-white px-4 py-2 text-sm text-brand-brown outline-none focus:border-brand-gold"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
            <input
              className="w-full rounded-md border border-brand-olive/30 bg-white px-4 py-2 text-sm text-brand-brown outline-none focus:border-brand-gold"
              placeholder="Endereço de entrega"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={criarCheckout.isPending}
              className="w-full rounded-full bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {criarCheckout.isPending ? "Redirecionando..." : "Ir para o pagamento"}
            </button>
          </form>
        </div>

        <div>
          <h2 className="mb-4 font-serif-brand text-xl text-brand-dark">Resumo do pedido</h2>
          <div className="divide-y divide-brand-olive/20 rounded-lg border border-brand-olive/20 bg-white">
            {linhas.map(({ quantidade, produto }) => (
              <div key={produto.id} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {produto.nome} <span className="text-brand-brown/50">x{quantidade}</span>
                </span>
                <span className="font-medium">{formatarPreco(Number(produto.precoVenda) * quantidade)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 text-sm">
              <span>Frete</span>
              <span className="font-medium">{formatarPreco(frete)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 font-serif-brand text-lg text-brand-dark">
              <span>Total</span>
              <span>{formatarPreco(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
