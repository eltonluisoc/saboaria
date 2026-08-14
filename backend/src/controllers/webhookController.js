const { validarAssinaturaWebhook } = require("../utils/mpSignature");
const { validarAssinaturaSeuRastreio } = require("../utils/seuRastreioSignature");
const { confirmarPagamento } = require("../services/pedidoService");
const { processarEventoWebhook } = require("../services/rastreioService");

async function mercadoPago(req, res) {
  const assinaturaValida = validarAssinaturaWebhook(req);
  if (!assinaturaValida) {
    console.warn("Webhook Mercado Pago com assinatura invalida ou ausente");
    return res.status(401).json({ error: "Assinatura invalida" });
  }

  const tipo = req.query.type || req.body?.type;
  const dataId = req.query["data.id"] || req.body?.data?.id;

  if (tipo !== "payment" || !dataId) {
    return res.status(200).send("ok");
  }

  try {
    await confirmarPagamento(dataId);
  } catch (err) {
    console.error("Erro ao processar webhook do Mercado Pago:", err.message);
  }

  return res.status(200).send("ok");
}

async function seuRastreio(req, res) {
  const assinaturaValida = validarAssinaturaSeuRastreio(req);
  if (!assinaturaValida) {
    console.warn("Webhook Seu Rastreio com assinatura invalida ou ausente");
    return res.status(401).json({ error: "Assinatura invalida" });
  }

  try {
    await processarEventoWebhook(req.body);
  } catch (err) {
    console.error("Erro ao processar webhook do Seu Rastreio:", err.message);
  }

  return res.status(200).send("ok");
}

module.exports = { mercadoPago, seuRastreio };
