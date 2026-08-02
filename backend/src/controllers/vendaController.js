const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");
const { criarPedidoComItens } = require("../services/pedidoService");

const STATUS_VALIDOS = ["pendente", "pago", "cancelado"];

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarVendaBody(body) {
  const { itens, clienteId, formaPagamento, status } = body || {};

  if (!Array.isArray(itens) || itens.length === 0) {
    return "Campo 'itens' deve ser uma lista com pelo menos um item";
  }

  const idsVistos = new Set();
  for (const item of itens) {
    const produtoId = Number(item?.produtoId);
    const quantidade = Number(item?.quantidade);

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      return "Cada item precisa de um 'produtoId' valido";
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return "Cada item precisa de 'quantidade' inteira maior que zero";
    }
    if (idsVistos.has(produtoId)) {
      return `Produto ${produtoId} aparece mais de uma vez nos itens (some as quantidades em uma linha)`;
    }
    idsVistos.add(produtoId);
  }

  if (clienteId !== undefined && clienteId !== null) {
    const cid = Number(clienteId);
    if (!Number.isInteger(cid) || cid <= 0) {
      return "Campo 'clienteId' invalido";
    }
  }

  if (formaPagamento !== undefined && formaPagamento !== null && typeof formaPagamento !== "string") {
    return "Campo 'formaPagamento' deve ser texto";
  }

  if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
    return `Campo 'status' deve ser um de: ${STATUS_VALIDOS.join(", ")}`;
  }

  return null;
}

async function criar(req, res) {
  const erro = validarVendaBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { itens, clienteId, formaPagamento, status } = req.body;

  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: Number(clienteId) } });
    if (!cliente) {
      return res.status(400).json({ error: "Cliente informado nao existe" });
    }
  }

  const produtoIds = itens.map((item) => Number(item.produtoId));
  const produtos = await prisma.produto.findMany({ where: { id: { in: produtoIds } } });
  const produtosPorId = new Map(produtos.map((p) => [p.id, p]));

  const idsFaltantes = produtoIds.filter((id) => !produtosPorId.has(id));
  if (idsFaltantes.length > 0) {
    return res.status(400).json({ error: `Produto(s) inexistente(s): ${idsFaltantes.join(", ")}` });
  }

  const pedido = await prisma.$transaction((tx) =>
    criarPedidoComItens(tx, {
      clienteId,
      origem: "manual",
      status: status || "pago",
      formaPagamento,
      itens,
      produtosPorId,
    })
  );

  return res.status(201).json(pedido);
}

async function listar(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query, { obrigatorio: false });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const where = { origem: "manual" };
  if (dataDe && dataAteExclusiva) {
    where.dataPedido = { gte: dataDe, lt: dataAteExclusiva };
  }

  const vendas = await prisma.pedido.findMany({
    where,
    orderBy: { dataPedido: "desc" },
    include: { itens: true },
  });

  return res.json(vendas);
}

async function detalhe(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const venda = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: { include: { produto: true } }, cliente: true },
  });

  if (!venda) {
    return res.status(404).json({ error: "Venda nao encontrada" });
  }

  return res.json(venda);
}

module.exports = { criar, listar, detalhe };
