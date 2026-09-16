const prisma = require("../config/prisma");
const { gerarParcelasPendentes, atualizarValor } = require("../services/proLaboreService");

function validarValor(valor) {
  const v = Number(valor);
  return Number.isFinite(v) && v > 0 ? v : null;
}

function validarDiaPagamento(dia) {
  const d = Number(dia);
  return Number.isInteger(d) && d >= 1 && d <= 28 ? d : null;
}

async function obter(req, res) {
  await gerarParcelasPendentes();

  const config = await prisma.proLabore.findFirst({ where: { ativo: true } });
  if (!config) {
    return res.json({ configurado: false });
  }

  const parcelas = await prisma.despesaGeral.findMany({
    where: { proLaboreId: config.id },
    orderBy: { dataDespesa: "asc" },
  });

  return res.json({
    configurado: true,
    id: config.id,
    valor: config.valor,
    diaPagamento: config.diaPagamento,
    parcelas,
  });
}

async function criar(req, res) {
  const { valor, diaPagamento } = req.body || {};

  const valorValido = validarValor(valor);
  if (valorValido === null) {
    return res.status(400).json({ error: "Campo 'valor' deve ser um numero maior que zero" });
  }

  const diaValido = validarDiaPagamento(diaPagamento);
  if (diaValido === null) {
    return res.status(400).json({ error: "Campo 'diaPagamento' deve ser um numero inteiro entre 1 e 28" });
  }

  const existente = await prisma.proLabore.findFirst({ where: { ativo: true } });
  if (existente) {
    return res.status(409).json({ error: "Pró-labore já está configurado - altere o valor em vez de criar de novo" });
  }

  await prisma.proLabore.create({
    data: { valor: valorValido, diaPagamento: diaValido },
  });

  await gerarParcelasPendentes();

  return obter(req, res);
}

async function atualizar(req, res) {
  const { valor } = req.body || {};

  const valorValido = validarValor(valor);
  if (valorValido === null) {
    return res.status(400).json({ error: "Campo 'valor' deve ser um numero maior que zero" });
  }

  const existente = await prisma.proLabore.findFirst({ where: { ativo: true } });
  if (!existente) {
    return res.status(404).json({ error: "Pró-labore ainda não foi configurado" });
  }

  await atualizarValor(valorValido);
  await gerarParcelasPendentes();

  return obter(req, res);
}

module.exports = { obter, criar, atualizar };
