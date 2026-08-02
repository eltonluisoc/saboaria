const crypto = require("crypto");
const { mercadoPagoWebhookSecret } = require("../config/env");

// Valida o header x-signature enviado pelo Mercado Pago.
// Referencia: manifest "id:{data.id};request-id:{x-request-id};ts:{ts};"
// assinado com HMAC-SHA256 usando o segredo configurado no painel do MP.
function validarAssinaturaWebhook(req) {
  if (!mercadoPagoWebhookSecret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET nao configurado - recusando webhook");
    return false;
  }

  const signatureHeader = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];
  const dataId = req.query["data.id"] || req.query.id;

  if (!signatureHeader || !requestId || !dataId) {
    return false;
  }

  const partes = {};
  for (const par of String(signatureHeader).split(",")) {
    const [chave, valor] = par.split("=");
    if (chave && valor) {
      partes[chave.trim()] = valor.trim();
    }
  }

  const { ts, v1 } = partes;
  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hashCalculado = crypto.createHmac("sha256", mercadoPagoWebhookSecret).update(manifest).digest("hex");

  const bufferCalculado = Buffer.from(hashCalculado, "hex");
  const bufferRecebido = Buffer.from(v1, "hex");

  if (bufferCalculado.length !== bufferRecebido.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferCalculado, bufferRecebido);
}

module.exports = { validarAssinaturaWebhook };
