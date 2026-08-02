import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCatalogo, type ProdutoPublico } from "../hooks/useCatalogo";
import { Loading } from "../components/Loading";

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CheckoutPage() {
  const { itens } = useCart();
  const { data: produtos, isLoading } = useCatalogo();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [enviado, setEnviado] = useState(false);

  if (isLoading) return <Loading />;

  const produtosPorId = new Map((produtos ?? []).map((p) => [p.id, p]));
  const linhas: { quantidade: number; produto: ProdutoPublico }[] = [];
  for (const item of itens) {
    const produto = produtosPorId.get(item.produtoId);
    if (produto) linhas.push({ quantidade: item.quantidade, produto });
  }
  const total = linhas.reduce((soma, l) => soma + Number(l.produto.precoVenda) * l.quantidade, 0);

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviado(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-serif-brand text-3xl text-brand-dark">Finalizar compra</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-4 font-serif-brand text-xl text-brand-dark">Seus dados</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {enviado ? (
              <p className="rounded-md bg-brand-olive/10 px-4 py-3 text-sm text-brand-brown">
                O pagamento online chega na Fase 7, com Mercado Pago. Por enquanto essa tela é só a
                estrutura do checkout.
              </p>
            ) : (
              <button
                type="submit"
                className="w-full rounded-full bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105"
              >
                Finalizar pedido
              </button>
            )}
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
