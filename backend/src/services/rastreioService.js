const prisma = require("../config/prisma");
const { seuRastreioApiKey } = require("../config/env");
const { enviarAtualizacaoPedido } = require("./emailService");

const SEURASTREIO_BASE_URL = "https://seurastreio.com.br";

function eventoEhEntrega(descricao) {
  return typeof descricao === "string" && descricao.toLowerCase().includes("entregue");
}

// Primeira consulta de um codigo novo: e o que "registra" ele no radar do
// Seu Rastreio (webhooks passam a chegar sozinhos depois disso). Guarda o
// evento mais recente e cria a primeira linha do historico local (o plano
// gratuito deles nao devolve historico completo, entao construimos o nosso).
async function consultarERegistrar(pedidoId, codigo) {
  if (!seuRastreioApiKey) {
    console.warn(`SEURASTREIO_API_KEY nao configurada - nao foi possivel registrar o codigo ${codigo}`);
    return;
  }

  const res = await fetch(`${SEURASTREIO_BASE_URL}/api/public/rastreio/${encodeURIComponent(codigo)}`, {
    headers: { Authorization: `Bearer ${seuRastreioApiKey}` },
  });

  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    console.error(`Erro ao consultar Seu Rastreio pro codigo ${codigo}: ${res.status} ${corpo}`);
    return;
  }

  const dados = await res.json();
  const evento = dados?.eventoMaisRecente;
  if (!evento) {
    return;
  }

  await registrarEventoNovo(pedidoId, {
    codigoEvento: evento.codigo || "desconhecido",
    descricao: evento.descricao || dados.message || "Status atualizado",
    local: evento.local || null,
    dataEvento: evento.data ? new Date(evento.data) : new Date(),
  });
}

// Chamado pelo webhook do Seu Rastreio quando um evento novo chega pra
// qualquer codigo que estamos monitorando.
async function processarEventoWebhook(payload) {
  const codigo = payload?.codigo;
  if (!codigo) {
    console.warn("Webhook do Seu Rastreio sem 'codigo' no payload - ignorado");
    return;
  }

  const pedido = await prisma.pedido.findFirst({ where: { codigoRastreio: codigo } });
  if (!pedido) {
    console.warn(`Webhook do Seu Rastreio pro codigo ${codigo}, mas nenhum pedido usa esse codigo`);
    return;
  }

  await registrarEventoNovo(pedido.id, {
    codigoEvento: payload.event || payload.eventLabel || "desconhecido",
    descricao: payload.lastEventDescription || payload.eventLabel || "Status atualizado",
    local: payload.lastEventLocation || null,
    dataEvento: payload.lastEventAt ? new Date(payload.lastEventAt) : new Date(),
  });
}

// Nucleo compartilhado: so grava/notifica se o evento for realmente novo
// (data mais recente que a ultima registrada) - evita duplicar em reenvio
// de webhook ou em consultas repetidas.
async function registrarEventoNovo(pedidoId, { codigoEvento, descricao, local, dataEvento }) {
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, include: { cliente: true } });
  if (!pedido) return;

  const ultimoRegistrado = pedido.ultimoEventoRastreio ? new Date(pedido.ultimoEventoRastreio) : null;
  if (ultimoRegistrado && dataEvento.getTime() <= ultimoRegistrado.getTime()) {
    return;
  }

  const entregue = eventoEhEntrega(descricao);
  const novoStatus = entregue ? "concluido" : pedido.status;

  await prisma.$transaction([
    prisma.rastreioEvento.create({
      data: { pedidoId, codigoEvento, descricao, local, dataEvento },
    }),
    prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        statusRastreioAtual: descricao,
        ultimoEventoRastreio: dataEvento.toISOString(),
        status: novoStatus,
      },
    }),
  ]);

  if (pedido.cliente) {
    await enviarAtualizacaoPedido({
      pedido,
      cliente: pedido.cliente,
      tituloEvento: entregue ? "Pedido entregue!" : "Atualização de entrega",
      descricaoEvento: descricao,
    });
  }
}

module.exports = { consultarERegistrar, processarEventoWebhook };
