const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarDespesaBody(body, { partial = false } = {}) {
  const { descricao, valor, categoria, dataDespesa, recorrente } = body || {};

  if (!partial || descricao !== undefined) {
    if (typeof descricao !== "string" || !descricao.trim()) {
      return "Campo 'descricao' e obrigatorio";
    }
  }

  if (!partial || valor !== undefined) {
    const v = Number(valor);
    if (!Number.isFinite(v) || v <= 0) {
      return "Campo 'valor' deve ser um numero maior que zero";
    }
  }

  if (!partial || dataDespesa !== undefined) {
    if (!dataDespesa || Number.isNaN(Date.parse(dataDespesa))) {
      return "Campo 'dataDespesa' invalido";
    }
  }

  if (categoria !== undefined && categoria !== null && typeof categoria !== "string") {
    return "Campo 'categoria' deve ser texto";
  }

  if (recorrente !== undefined && typeof recorrente !== "boolean") {
    return "Campo 'recorrente' deve ser booleano";
  }

  return null;
}

async function criar(req, res) {
  const erro = validarDespesaBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { descricao, valor, categoria, dataDespesa, recorrente } = req.body;

  const despesa = await prisma.despesaGeral.create({
    data: {
      descricao: descricao.trim(),
      valor,
      categoria: categoria ? categoria.trim() : null,
      dataDespesa: new Date(dataDespesa),
      recorrente: recorrente === undefined ? false : recorrente,
    },
  });

  return res.status(201).json(despesa);
}

async function listar(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query, { obrigatorio: false });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const where = {};
  if (dataDe && dataAteExclusiva) {
    where.dataDespesa = { gte: dataDe, lt: dataAteExclusiva };
  }

  const despesas = await prisma.despesaGeral.findMany({
    where,
    orderBy: { dataDespesa: "desc" },
  });

  return res.json(despesas);
}

async function detalhe(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const despesa = await prisma.despesaGeral.findUnique({ where: { id } });
  if (!despesa) {
    return res.status(404).json({ error: "Despesa nao encontrada" });
  }

  return res.json(despesa);
}

async function editar(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const erro = validarDespesaBody(req.body, { partial: true });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { descricao, valor, categoria, dataDespesa, recorrente } = req.body;
  const data = {};
  if (descricao !== undefined) data.descricao = descricao.trim();
  if (valor !== undefined) data.valor = valor;
  if (categoria !== undefined) data.categoria = categoria ? categoria.trim() : null;
  if (dataDespesa !== undefined) data.dataDespesa = new Date(dataDespesa);
  if (recorrente !== undefined) data.recorrente = recorrente;

  try {
    const despesa = await prisma.despesaGeral.update({ where: { id }, data });
    return res.json(despesa);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Despesa nao encontrada" });
    }
    throw err;
  }
}

async function remover(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  try {
    await prisma.despesaGeral.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Despesa nao encontrada" });
    }
    throw err;
  }
}

module.exports = { criar, listar, detalhe, editar, remover };
