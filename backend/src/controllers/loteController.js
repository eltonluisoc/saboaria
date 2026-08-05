const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarLoteBody(body) {
  const { produtoId, quantidadeProduzida, dataProducao } = body || {};

  if (!Number.isInteger(Number(produtoId)) || Number(produtoId) <= 0) {
    return "Campo 'produtoId' e obrigatorio e deve ser valido";
  }
  if (!Number.isInteger(Number(quantidadeProduzida)) || Number(quantidadeProduzida) <= 0) {
    return "Campo 'quantidadeProduzida' deve ser um numero inteiro maior que zero";
  }
  if (!dataProducao || Number.isNaN(Date.parse(dataProducao))) {
    return "Campo 'dataProducao' invalido";
  }

  return null;
}

async function criar(req, res) {
  const erro = validarLoteBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const produtoId = Number(req.body.produtoId);
  const quantidadeProduzida = Number(req.body.quantidadeProduzida);
  const { dataProducao } = req.body;

  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    include: { receita: { include: { insumo: true } } },
  });

  if (!produto) {
    return res.status(404).json({ error: "Produto nao encontrado" });
  }

  if (produto.receita.length === 0) {
    return res.status(400).json({
      error: "Produto sem receita cadastrada, nao e possivel registrar producao",
    });
  }

  const insumosInsuficientes = produto.receita
    .map((item) => ({
      nome: item.insumo.nome,
      necessario: Number(item.quantidadeUsada) * quantidadeProduzida,
      disponivel: Number(item.insumo.estoqueAtual),
    }))
    .filter((item) => item.necessario > item.disponivel);

  if (insumosInsuficientes.length > 0) {
    const lista = insumosInsuficientes
      .map((i) => `${i.nome} (precisa ${i.necessario}, tem ${i.disponivel})`)
      .join(", ");
    return res.status(409).json({
      error: `Estoque insuficiente de insumo(s) para registrar o lote: ${lista}`,
    });
  }

  const lote = await prisma.$transaction(async (tx) => {
    for (const item of produto.receita) {
      const necessario = Number(item.quantidadeUsada) * quantidadeProduzida;
      await tx.insumo.update({
        where: { id: item.insumoId },
        data: { estoqueAtual: { decrement: necessario } },
      });
    }

    const novoLote = await tx.loteProducao.create({
      data: {
        produtoId,
        quantidadeProduzida,
        dataProducao: new Date(dataProducao),
      },
    });

    await tx.produto.update({
      where: { id: produtoId },
      data: { estoqueAtual: { increment: quantidadeProduzida } },
    });

    return novoLote;
  });

  return res.status(201).json(lote);
}

async function listar(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query, { obrigatorio: false });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { produtoId } = req.query;
  const where = {};
  if (dataDe && dataAteExclusiva) {
    where.dataProducao = { gte: dataDe, lt: dataAteExclusiva };
  }
  if (produtoId !== undefined) {
    const id = parseId(produtoId);
    if (!id) {
      return res.status(400).json({ error: "Campo 'produtoId' invalido" });
    }
    where.produtoId = id;
  }

  const lotes = await prisma.loteProducao.findMany({
    where,
    include: { produto: true },
    orderBy: { dataProducao: "desc" },
  });

  return res.json(lotes);
}

module.exports = { criar, listar };
