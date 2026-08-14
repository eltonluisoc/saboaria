const crypto = require("crypto");
const { seuRastreioWebhookSecret } = require("../config/env");

// Valida o header X-SeuRastreio-Signature, formato "t=<ts>,v1=<hex>",
// assinado como HMAC-SHA256(secret, "{ts}.{rawBody}"). Precisa do corpo
// bruto da requisicao (req.rawBody, capturado em app.js), nao do body
// ja re-serializado pelo express.json - senao a assinatura nao bate.
function validarAssinaturaSeuRastreio(req) {
  if (!seuRastreioWebhookSecret) {
    console.warn("SEURASTREIO_WEBHOOK_SECRET nao configurado - recusando webhook");
    return false;
  }

  const signatureHeader = req.headers["x-seurastreio-signature"];
  if (!signatureHeader || !req.rawBody) {
    return false;
  }

  const partes = {};
  for (const par of String(signatureHeader).split(",")) {
    const [chave, valor] = par.split("=");
    if (chave && valor) {
      partes[chave.trim()] = valor.trim();
    }
  }

  const { t, v1 } = partes;
  if (!t || !v1) {
    return false;
  }

  const manifest = `${t}.${req.rawBody.toString("utf8")}`;
  const hashCalculado = crypto.createHmac("sha256", seuRastreioWebhookSecret).update(manifest).digest("hex");

  const bufferCalculado = Buffer.from(hashCalculado, "hex");
  const bufferRecebido = Buffer.from(v1, "hex");

  if (bufferCalculado.length !== bufferRecebido.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferCalculado, bufferRecebido);
}

module.exports = { validarAssinaturaSeuRastreio };
