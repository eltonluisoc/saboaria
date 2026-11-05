import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LOJA } from "../lojaInfo";

// Texto descreve o que o sistema faz HOJE. Ao adicionar qualquer coleta nova
// (ex: medicao de acessos), atualizar esta pagina e a data no topo.
const ULTIMA_ATUALIZACAO = "5 de novembro de 2026";

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-serif-brand text-xl text-brand-dark">{titulo}</h2>
      {children}
    </div>
  );
}

export function PoliticaPrivacidadePage() {
  const emailLink = (
    <a href={`mailto:${LOJA.email}`} className="text-brand-olive underline hover:text-brand-gold">
      {LOJA.email}
    </a>
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif-brand text-3xl text-brand-dark">Política de privacidade</h1>
      <p className="mt-2 text-xs text-brand-brown/60">Última atualização: {ULTIMA_ATUALIZACAO}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-brand-brown/90">
        <p>
          Esta política explica quais dados pessoais a {LOJA.nomeFantasia} coleta, para que usa e quais são os seus
          direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).
        </p>

        <Secao titulo="Quem é responsável pelos seus dados">
          <p>
            {LOJA.nomeFantasia}
            {LOJA.nomeResponsavel ? `, ${LOJA.nomeResponsavel}` : ""}, CPF {LOJA.cpf}, {LOJA.endereco}. Contato:{" "}
            {emailLink}.
          </p>
        </Secao>

        <Secao titulo="Quais dados coletamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Ao comprar:</strong> nome, e-mail, telefone e endereço de entrega, além dos produtos e valores do
              pedido.
            </li>
            <li>
              <strong>Ao criar uma conta:</strong> nome, e-mail, telefone (opcional), sua escolha sobre receber
              novidades e a senha — guardada apenas de forma criptografada, nunca em texto legível.
            </li>
            <li>
              <strong>Pagamento:</strong> é feito no ambiente do Mercado Pago. Não recebemos nem guardamos dados do
              seu cartão; recebemos só a confirmação e a forma de pagamento.
            </li>
          </ul>
        </Secao>

        <Secao titulo="Para que usamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Processar, entregar e acompanhar seu pedido, e falar com você sobre ele (execução do contrato).</li>
            <li>Manter sua conta e aplicar descontos de cliente cadastrado (execução do contrato).</li>
            <li>Guardar registros de vendas exigidos pela legislação fiscal e do consumidor (obrigação legal).</li>
            <li>Enviar novidades e promoções, somente se você marcar essa opção (consentimento — pode retirar quando quiser).</li>
            <li>Proteger o site contra fraudes e acessos indevidos (legítimo interesse).</li>
          </ul>
        </Secao>

        <Secao titulo="Com quem compartilhamos">
          <p className="mb-2">Não vendemos seus dados. Compartilhamos apenas o necessário com quem nos ajuda a operar:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Mercado Pago — processamento do pagamento.</li>
            <li>Correios ou transportadora — entrega do pedido.</li>
            <li>Serviço de envio de e-mails — avisos sobre o seu pedido.</li>
            <li>Serviço de rastreamento de encomendas — só o código de rastreio, sem seus dados pessoais.</li>
            <li>Provedores de hospedagem do site e do banco de dados.</li>
            <li>
              Ferramenta de inteligência artificial usada internamente para organizar o registro de vendas — pode
              receber o nome do comprador.
            </li>
          </ul>
          <p className="mt-2">
            Alguns desses fornecedores podem armazenar dados em servidores fora do Brasil, sempre com o uso limitado
            às finalidades acima.
          </p>
        </Secao>

        <Secao titulo="Cookies e armazenamento no navegador">
          <p>
            Usamos apenas o essencial para o site funcionar: um cookie que mantém você conectado à sua conta e o
            armazenamento do navegador para guardar o seu carrinho. Não usamos cookies de publicidade.
          </p>
        </Secao>

        <Secao titulo="Por quanto tempo guardamos">
          <p>
            Os dados da conta ficam guardados enquanto ela existir. Os registros de pedidos são mantidos pelo prazo
            exigido pela legislação fiscal e de defesa do consumidor. Depois disso, são excluídos ou anonimizados.
          </p>
        </Secao>

        <Secao titulo="Seus direitos">
          <p className="mb-2">Você pode, a qualquer momento, pedir:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>confirmação de que tratamos seus dados e acesso a eles;</li>
            <li>correção de dados incompletos ou desatualizados;</li>
            <li>exclusão dos dados, exceto os que a lei nos obriga a guardar;</li>
            <li>retirada do consentimento para receber novidades;</li>
            <li>informações sobre com quem compartilhamos seus dados.</li>
          </ul>
          <p className="mt-2">
            Basta escrever para {emailLink}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade
            Nacional de Proteção de Dados (ANPD).
          </p>
        </Secao>

        <Secao titulo="Mudanças nesta política">
          <p>
            Se mudarmos a forma de tratar seus dados, atualizaremos esta página e a data no topo.
          </p>
        </Secao>

        <Link to="/catalogo" className="inline-block text-brand-olive hover:text-brand-gold">
          &larr; Voltar para o catálogo
        </Link>
      </div>
    </div>
  );
}
