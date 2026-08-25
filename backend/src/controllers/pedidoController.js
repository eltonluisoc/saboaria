const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");
const { consultarERegistrar } = require("../services/rastreioService");

const STATUS_VALIDOS = ["pendente", "pago", "enviado", "concluido", "cancelado"];
const ORIGENS_VALIDAS = ["site", "manual"];
const FLUXO_STATUS = ["pago", "enviado", "concluido"];

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listar(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query, { obrigatorio: false });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { status, origem } = req.query;

  if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ error: `Campo 'status' deve ser um de: ${STATUS_VALIDOS.join(", ")}` });
  }
  if (origem !== undefined && !ORIGENS_VALIDAS.includes(origem)) {
    return res.status(400).json({ error: `Campo 'origem' deve ser um de: ${ORIGENS_VALIDAS.join(", ")}` });
  }

  const where = {};
  if (dataDe && dataAteExclusiva) {
    where.dataPedido = { gte: dataDe, lt: dataAteExclusiva };
  }
  if (status) where.status = status;
  if (origem) where.origem = origem;

  const pedidos = await prisma.pedido.findMany({
    where,
    orderBy: { dataPedido: "desc" },
    include: { itens: true, cliente: true },
  });

  return res.json(pedidos);
}

async function detalhe(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: { include: { produto: true } }, cliente: true },
  });

  if (!pedido) {
    return res.status(404).json({ error: "Pedido nao encontrado" });
  }

  return res.json(pedido);
}

async function cancelar(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) {
    return res.status(404).json({ error: "Pedido nao encontrado" });
  }

  if (pedido.status !== "pendente") {
    return res.status(409).json({
      error: `Pedido ja esta '${pedido.status}' - so e possivel cancelar pedidos pendentes`,
    });
  }

  const atualizado = await prisma.pedido.update({
    where: { id },
    data: { status: "cancelado" },
  });

  return res.json(atualizado);
}

async function atualizarRastreio(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const { codigoRastreio } = req.body || {};
  if (typeof codigoRastreio !== "string" || !codigoRastreio.trim()) {
    return res.status(400).json({ error: "Campo 'codigoRastreio' e obrigatorio" });
  }

  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) {
    return res.status(404).json({ error: "Pedido nao encontrado" });
  }

  if (pedido.status !== "pago" && pedido.status !== "enviado") {
    return res.status(400).json({
      error: "So e possivel registrar rastreio de pedidos pagos (ou ja enviados)",
    });
  }

  const codigo = codigoRastreio.trim();
  const primeiraVez = !pedido.codigoRastreio;

  const atualizado = await prisma.pedido.update({
    where: { id },
    data: {
      codigoRastreio: codigo,
      status: primeiraVez && pedido.status === "pago" ? "enviado" : pedido.status,
    },
  });

  if (primeiraVez) {
    try {
      await consultarERegistrar(id, codigo);
    } catch (err) {
      console.error(`Erro ao registrar codigo de rastreio ${codigo} pro pedido ${id}:`, err.message);
    }
  }

  return res.json(atualizado);
}

// So pra venda manual de balcao - pedido do site so vira "pago" via
// confirmarPagamento (pedidoService.js), que verifica de verdade com o
// Mercado Pago. Deixar isso generico permitiria "confirmar" um pagamento
// do site sem o dinheiro ter entrado de fato.
async function marcarComoRecebido(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const pedido = await prisma.pedido.findUnique({ where: { id }, include: { itens: true } });
  if (!pedido) {
    return res.status(404).json({ error: "Pedido nao encontrado" });
  }

  if (pedido.origem !== "manual") {
    return res.status(409).json({ error: "So e possivel marcar como recebido vendas manuais" });
  }

  if (pedido.status !== "pendente") {
    return res.status(409).json({
      error: `Pedido ja esta '${pedido.status}' - so e possivel marcar como recebido pedidos pendentes`,
    });
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    for (const item of pedido.itens) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { decrement: item.quantidade } },
      });
    }

    return tx.pedido.update({ where: { id }, data: { status: "pago" } });
  });

  return res.json(atualizado);
}

async function avancarStatus(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) {
    return res.status(404).json({ error: "Pedido nao encontrado" });
  }

  const indiceAtual = FLUXO_STATUS.indexOf(pedido.status);
  if (indiceAtual === -1 || indiceAtual === FLUXO_STATUS.length - 1) {
    return res.status(409).json({
      error: `Pedido em '${pedido.status}' nao pode avancar de status`,
    });
  }

  const proximoStatus = FLUXO_STATUS[indiceAtual + 1];
  const atualizado = await prisma.pedido.update({
    where: { id },
    data: { status: proximoStatus },
  });

  return res.json(atualizado);
}

module.exports = { listar, detalhe, cancelar, atualizarRastreio, avancarStatus, marcarComoRecebido };
