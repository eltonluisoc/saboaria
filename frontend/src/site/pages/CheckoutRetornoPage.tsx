import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useConfirmarPagamento } from "../hooks/useCheckout";
import { Loading } from "../components/Loading";
import { Sprig } from "../components/Sprig";

type Resultado = "pago" | "pendente" | "cancelado" | "erro";

export function CheckoutRetornoPage() {
  const [searchParams] = useSearchParams();
  const { limpar } = useCart();
  const confirmarPagamento = useConfirmarPagamento();
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      const paymentId = searchParams.get("payment_id");

      // Sem payment_id nao ha nada seguro pra consultar (o status por
      // pedido.id sequencial foi removido de proposito - permitia qualquer
      // pessoa consultar o status de qualquer pedido so trocando o numero).
      // Nesse caso mostramos "pendente" generico sem chamar a API.
      if (!paymentId) {
        if (!cancelado) setResultado("pendente");
        return;
      }

      try {
        const resposta = await confirmarPagamento.mutateAsync(paymentId);
        if (cancelado) return;

        if (resposta.status === "pago") {
          limpar();
          setResultado("pago");
        } else if (resposta.status === "cancelado") {
          setResultado("cancelado");
        } else {
          setResultado("pendente");
        }
      } catch {
        if (!cancelado) setResultado("erro");
      }
    }

    verificar();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (resultado === null) {
    return <Loading />;
  }

  const conteudo: Record<Resultado, { titulo: string; texto: string; tone: string }> = {
    pago: {
      titulo: "Pagamento confirmado!",
      texto: "Seu pedido foi recebido e já está sendo preparado com todo o cuidado artesanal da Lud'E.",
      tone: "text-brand-dark",
    },
    pendente: {
      titulo: "Pagamento em processamento",
      texto: "Assim que a confirmação chegar (Pix pode levar alguns minutos), seu pedido será preparado.",
      tone: "text-brand-dark",
    },
    cancelado: {
      titulo: "Pagamento não aprovado",
      texto: "Algo deu errado com o pagamento. Você pode tentar novamente pelo carrinho.",
      tone: "text-red-700",
    },
    erro: {
      titulo: "Não conseguimos confirmar seu pagamento",
      texto: "Se você concluiu o pagamento, entre em contato com a gente informando o pedido.",
      tone: "text-red-700",
    },
  };

  const { titulo, texto, tone } = conteudo[resultado];

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <Sprig className="mx-auto h-16 w-auto text-brand-olive/40" />
      <h1 className={`mt-4 font-serif-brand text-3xl ${tone}`}>{titulo}</h1>
      <p className="mt-3 text-brand-brown/80">{texto}</p>
      <Link
        to="/catalogo"
        className="mt-8 inline-block rounded-full bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-dark"
      >
        Voltar ao catálogo
      </Link>
    </div>
  );
}
