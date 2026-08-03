const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");

const STATUS_VALIDOS = ["pendente", "pago", "cancelado"];
const ORIGENS_VALIDAS = ["site", "manual"];

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

module.exports = { listar, detalhe };
