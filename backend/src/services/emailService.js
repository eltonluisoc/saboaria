const { resendApiKey, emailFrom, frontendUrl } = require("../config/env");

function templateAtualizacaoPedido({ pedido, cliente, tituloEvento, descricaoEvento }) {
  const link = `${frontendUrl}/pedido/${pedido.codigoAcesso}`;

  return `
    <div style="background-color:#f5efe4;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <div style="background-color:#2f2418;padding:20px 24px;">
          <p style="margin:0;color:#f5efe4;font-size:18px;font-weight:600;">Lud'E Saboaria Artesanal</p>
        </div>
        <div style="padding:24px;color:#3b2f22;">
          <p style="margin:0 0 12px;font-size:16px;">Olá, ${cliente.nome}!</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
            Uma atualização no seu pedido <strong>#${pedido.id}</strong>:
          </p>
          <p style="margin:0 0 20px;padding:12px 16px;background-color:#f5efe4;border-radius:6px;font-size:15px;">
            <strong>${tituloEvento}</strong><br />
            ${descricaoEvento}
          </p>
          <a href="${link}" style="display:inline-block;padding:10px 20px;background-color:#c9a15a;color:#2f2418;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
            Acompanhar pedido
          </a>
        </div>
      </div>
    </div>
  `;
}

async function enviarAtualizacaoPedido({ pedido, cliente, tituloEvento, descricaoEvento }) {
  if (!resendApiKey || !emailFrom) {
    console.warn(
      `RESEND_API_KEY/EMAIL_FROM nao configurados - e-mail nao enviado (pedido ${pedido.id}, evento "${tituloEvento}")`
    );
    return;
  }

  if (!cliente?.email) {
    console.warn(`Pedido ${pedido.id} sem cliente/e-mail - nada a notificar`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: cliente.email,
      subject: `Pedido #${pedido.id} - ${tituloEvento}`,
      html: templateAtualizacaoPedido({ pedido, cliente, tituloEvento, descricaoEvento }),
    }),
  });

  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    console.error(`Erro ao enviar e-mail via Resend (pedido ${pedido.id}): ${res.status} ${corpo}`);
  }
}

module.exports = { enviarAtualizacaoPedido };
