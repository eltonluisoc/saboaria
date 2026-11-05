import { Link } from "react-router-dom";
import { LOJA } from "../lojaInfo";

export function PoliticaTrocasPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif-brand text-3xl text-brand-dark">Política de troca e devolução</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-brand-brown/90">
        <p>
          De acordo com o Código de Defesa do Consumidor (art. 49), toda compra feita fora de uma loja física —
          incluindo compras pela internet — tem direito de arrependimento em até <strong>7 (sete) dias corridos</strong>,
          contados a partir da data de recebimento do produto.
        </p>

        <div>
          <h2 className="mb-2 font-serif-brand text-xl text-brand-dark">Como funciona</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Prazo de 7 dias corridos a partir do recebimento do pedido.</li>
            <li>O produto deve estar sem uso, lacrado e na embalagem original.</li>
            <li>O valor pago é integralmente devolvido, incluindo o frete.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-serif-brand text-xl text-brand-dark">Como solicitar</h2>
          <p>
            Entre em contato pelo WhatsApp (botão no canto da tela) ou pelo e-mail{" "}
            <a href={`mailto:${LOJA.email}`} className="text-brand-olive underline hover:text-brand-gold">
              {LOJA.email}
            </a>{" "}
            informando o número do pedido e o motivo da devolução. Vamos combinar juntos a forma de envio do produto de volta.
          </p>
        </div>

        <p className="text-xs text-brand-brown/60">
          Este texto é um resumo informativo baseado no art. 49 do Código de Defesa do Consumidor e pode não cobrir
          todos os casos específicos — em caso de dúvida, fale com a gente antes de comprar.
        </p>

        <Link to="/catalogo" className="inline-block text-brand-olive hover:text-brand-gold">
          &larr; Voltar para o catálogo
        </Link>
      </div>
    </div>
  );
}
