const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");
const {
  gerarDespesasRecorrentesPendentes,
  sincronizarOcorrenciasFuturasDaOrigem,
} = require("../services/despesaService");

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarDespesaBody(body, { partial = false } = {}) {
  const { descricao, valor, categoria, dataDespesa, recorrente, dataFimRecorrencia, dataVencimento } = body || {};

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

  if (dataFimRecorrencia !== undefined && dataFimRecorrencia !== null) {
    if (Number.isNaN(Date.parse(dataFimRecorrencia))) {
      return "Campo 'dataFimRecorrencia' invalido";
    }
    const efetivamenteRecorrente = partial
      ? recorrente === undefined || recorrente === true
      : recorrente === true;
    if (!efetivamenteRecorrente) {
      return "Campo 'dataFimRecorrencia' so se aplica a uma despesa recorrente";
    }
  }

  if (dataVencimento !== undefined && dataVencimento !== null) {
    if (Number.isNaN(Date.parse(dataVencimento))) {
      return "Campo 'dataVencimento' invalido";
    }
  }

  return null;
}

async function criar(req, res) {
  const erro = validarDespesaBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { descricao, valor, categoria, dataDespesa, recorrente, dataFimRecorrencia, dataVencimento } = req.body;

  const despesa = await prisma.despesaGeral.create({
    data: {
      descricao: descricao.trim(),
      valor,
      categoria: categoria ? categoria.trim() : null,
      dataDespesa: new Date(dataDespesa),
      recorrente: recorrente === undefined ? false : recorrente,
      dataFimRecorrencia: dataFimRecorrencia ? new Date(dataFimRecorrencia) : null,
      dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
    },
  });

  if (despesa.recorrente) {
    await gerarDespesasRecorrentesPendentes();
  }

  return res.status(201).json(despesa);
}

async function listar(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query, { obrigatorio: false });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  await gerarDespesasRecorrentesPendentes();

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

  const despesaAntes = await prisma.despesaGeral.findUnique({ where: { id } });
  if (!despesaAntes) {
    return res.status(404).json({ error: "Despesa nao encontrada" });
  }

  const { descricao, valor, categoria, dataDespesa, recorrente, dataFimRecorrencia, dataVencimento } = req.body;
  const data = {};
  if (descricao !== undefined) data.descricao = descricao.trim();
  if (valor !== undefined) data.valor = valor;
  if (categoria !== undefined) data.categoria = categoria ? categoria.trim() : null;
  if (dataDespesa !== undefined) data.dataDespesa = new Date(dataDespesa);
  if (recorrente !== undefined) data.recorrente = recorrente;
  if (dataFimRecorrencia !== undefined) {
    data.dataFimRecorrencia = dataFimRecorrencia ? new Date(dataFimRecorrencia) : null;
  }
  if (dataVencimento !== undefined) {
    data.dataVencimento = dataVencimento ? new Date(dataVencimento) : null;
  }

  const despesa = await prisma.$transaction(async (tx) => {
    const atualizada = await tx.despesaGeral.update({ where: { id }, data });
    // So sincroniza projecoes futuras quando quem foi editada e a origem da
    // recorrencia (despesaOrigemId nulo) - editar uma copia gerada e so um
    // ajuste pontual daquele mes, sem efeito nas outras.
    if (atualizada.despesaOrigemId === null) {
      await sincronizarOcorrenciasFuturasDaOrigem(tx, despesaAntes, atualizada);
    }
    return atualizada;
  });

  if (despesa.despesaOrigemId === null && despesa.recorrente) {
    await gerarDespesasRecorrentesPendentes();
  }

  return res.json(despesa);
}

// Remover uma despesa recorrente (a origem, uma copia ja gerada, ou uma
// origem que parou de ser recorrente mas ainda tem copias antigas ligadas
// a ela) apaga a serie inteira - origem + todas as copias, inclusive ja
// pagas - em vez de so aquela linha. Isso evita duas armadilhas: copia
// excluida reaparecendo sozinha no proximo carregamento (a origem
// continuava recorrente e gerava de novo) e origem excluida deixando
// copias orfas com despesaOrigemId nulo, que o gerador passaria a tratar
// como uma nova origem por engano.
async function remover(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const despesa = await prisma.despesaGeral.findUnique({ where: { id } });
  if (!despesa) {
    return res.status(404).json({ error: "Despesa nao encontrada" });
  }

  const ehOrigemComCopias =
    despesa.despesaOrigemId === null &&
    (await prisma.despesaGeral.count({ where: { despesaOrigemId: despesa.id } })) > 0;
  const fazParteDeRecorrencia = despesa.recorrente || despesa.despesaOrigemId !== null || ehOrigemComCopias;

  if (!fazParteDeRecorrencia) {
    await prisma.despesaGeral.delete({ where: { id } });
    return res.status(204).send();
  }

  const raizId = despesa.despesaOrigemId ?? despesa.id;
  await prisma.despesaGeral.deleteMany({
    where: { OR: [{ id: raizId }, { despesaOrigemId: raizId }] },
  });
  return res.status(204).send();
}

async function marcarComoPaga(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  try {
    const despesa = await prisma.despesaGeral.update({
      where: { id },
      data: { pago: true, dataPagamento: new Date() },
    });
    return res.json(despesa);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Despesa nao encontrada" });
    }
    throw err;
  }
}

async function marcarComoEmAberto(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  try {
    const despesa = await prisma.despesaGeral.update({
      where: { id },
      data: { pago: false, dataPagamento: null },
    });
    return res.json(despesa);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Despesa nao encontrada" });
    }
    throw err;
  }
}

module.exports = { criar, listar, detalhe, editar, remover, marcarComoPaga, marcarComoEmAberto };
