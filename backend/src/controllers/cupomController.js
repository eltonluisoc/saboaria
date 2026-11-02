const prisma = require("../config/prisma");

function normalizarCodigo(codigo) {
  return typeof codigo === "string" ? codigo.trim().toUpperCase() : "";
}

function validarCupomBody(body, { parcial = false } = {}) {
  const { codigo, percentualDesconto, validoAte, usoMaximo } = body || {};

  if (!parcial || codigo !== undefined) {
    if (!normalizarCodigo(codigo)) {
      return "Campo 'codigo' e obrigatorio";
    }
  }

  if (!parcial || percentualDesconto !== undefined) {
    const pct = Number(percentualDesconto);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return "Campo 'percentualDesconto' deve ser um numero entre 0 e 100";
    }
  }

  if (validoAte !== undefined && validoAte !== null && Number.isNaN(Date.parse(validoAte))) {
    return "Campo 'validoAte' invalido";
  }

  if (usoMaximo !== undefined && usoMaximo !== null) {
    const uso = Number(usoMaximo);
    if (!Number.isInteger(uso) || uso <= 0) {
      return "Campo 'usoMaximo' deve ser um inteiro maior que zero";
    }
  }

  return null;
}

async function criar(req, res) {
  const erro = validarCupomBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { percentualDesconto, validoAte, usoMaximo } = req.body;
  const codigo = normalizarCodigo(req.body.codigo);

  const existente = await prisma.cupom.findUnique({ where: { codigo } });
  if (existente) {
    return res.status(409).json({ error: "Ja existe um cupom com esse codigo" });
  }

  const cupom = await prisma.cupom.create({
    data: {
      codigo,
      percentualDesconto,
      validoAte: validoAte ? new Date(validoAte) : null,
      usoMaximo: usoMaximo ?? null,
    },
  });

  return res.status(201).json(cupom);
}

async function listar(req, res) {
  const cupons = await prisma.cupom.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(cupons);
}

async function editar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const erro = validarCupomBody(req.body, { parcial: true });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const cupom = await prisma.cupom.findUnique({ where: { id } });
  if (!cupom) {
    return res.status(404).json({ error: "Cupom nao encontrado" });
  }

  const data = {};
  if (req.body.percentualDesconto !== undefined) data.percentualDesconto = req.body.percentualDesconto;
  if (req.body.validoAte !== undefined) data.validoAte = req.body.validoAte ? new Date(req.body.validoAte) : null;
  if (req.body.usoMaximo !== undefined) data.usoMaximo = req.body.usoMaximo;

  const atualizado = await prisma.cupom.update({ where: { id }, data });
  return res.json(atualizado);
}

async function alternarAtivo(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const cupom = await prisma.cupom.findUnique({ where: { id } });
  if (!cupom) {
    return res.status(404).json({ error: "Cupom nao encontrado" });
  }

  const atualizado = await prisma.cupom.update({ where: { id }, data: { ativo: !cupom.ativo } });
  return res.json(atualizado);
}

module.exports = { criar, listar, editar, alternarAtivo };
