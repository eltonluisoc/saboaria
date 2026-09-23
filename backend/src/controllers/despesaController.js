const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");
const {
  gerarDespesasRecorrentesPendentes,
  sincronizarOcorrenciasFuturasDaOrigem,
} = require("../services/despesaService");
const { gerarParcelasPendentes: gerarParcelasProLaborePendentes } = require("../services/proLaboreService");

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const ERRO_DESPESA_DE_COMPRA =
  "Essa despesa foi gerada automaticamente por uma compra de insumo - edite ou remova a compra na tela de Insumos.";

const ERRO_DESPESA_DE_PRO_LABORE =
  "Essa despesa foi gerada automaticamente pelo Pró-labore - altere o valor em Pró-labore.";

const ERRO_DESPESA_PARCELADA =
  "Essa despesa faz parte de uma compra parcelada - pra corrigir, remova a compra inteira (só é possível se nenhuma parcela estiver paga) e cadastre de novo.";

const FORMA_PAGAMENTO_PADRAO_PARCELADA = "Cartão de crédito";

function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

function validarDespesaBody(body, { partial = false } = {}) {
  const { descricao, valor, categoria, dataDespesa, recorrente, dataFimRecorrencia, dataVencimento, formaPagamento } =
    body || {};

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

  if (formaPagamento !== undefined && formaPagamento !== null && typeof formaPagamento !== "string") {
    return "Campo 'formaPagamento' deve ser texto";
  }

  return null;
}

async function criar(req, res) {
  const erro = validarDespesaBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { descricao, valor, categoria, dataDespesa, recorrente, dataFimRecorrencia, dataVencimento, formaPagamento } =
    req.body;

  const despesa = await prisma.despesaGeral.create({
    data: {
      descricao: descricao.trim(),
      formaPagamento: formaPagamento ? formaPagamento.trim() : null,
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

// Compra parcelada (ex: cartao de credito em N vezes): cria a "origem"
// (CompraParcelada, so os dados da compra) e ja gera as N parcelas de uma
// vez, uma DespesaGeral por mes a partir de dataDespesa - mesmo dia do mes,
// ajustado quando o mes for mais curto (mesmo helper que despesaService.js/
// proLaboreService.js ja usam). Valor dividido em centavos inteiros, resto
// (se houver) todo na ultima parcela - a soma das parcelas sempre bate
// exatamente com o valor total informado.
async function criarParcelada(req, res) {
  const { descricao, valorTotal, categoria, dataDespesa, formaPagamento, totalParcelas } = req.body || {};

  if (typeof descricao !== "string" || !descricao.trim()) {
    return res.status(400).json({ error: "Campo 'descricao' e obrigatorio" });
  }
  const valor = Number(valorTotal);
  if (!Number.isFinite(valor) || valor <= 0) {
    return res.status(400).json({ error: "Campo 'valorTotal' deve ser um numero maior que zero" });
  }
  if (!dataDespesa || Number.isNaN(Date.parse(dataDespesa))) {
    return res.status(400).json({ error: "Campo 'dataDespesa' invalido" });
  }
  const parcelas = Number(totalParcelas);
  if (!Number.isInteger(parcelas) || parcelas < 2 || parcelas > 36) {
    return res.status(400).json({ error: "Campo 'totalParcelas' deve ser um numero inteiro entre 2 e 36" });
  }
  if (categoria !== undefined && categoria !== null && typeof categoria !== "string") {
    return res.status(400).json({ error: "Campo 'categoria' deve ser texto" });
  }
  if (formaPagamento !== undefined && formaPagamento !== null && typeof formaPagamento !== "string") {
    return res.status(400).json({ error: "Campo 'formaPagamento' deve ser texto" });
  }

  const descricaoLimpa = descricao.trim();
  const categoriaLimpa = categoria ? categoria.trim() : null;
  const formaPagamentoFinal = formaPagamento && formaPagamento.trim() ? formaPagamento.trim() : FORMA_PAGAMENTO_PADRAO_PARCELADA;
  const dataBase = new Date(dataDespesa);
  const totalCentavos = Math.round(valor * 100);
  const centavosPorParcela = Math.floor(totalCentavos / parcelas);
  const restoCentavos = totalCentavos - centavosPorParcela * parcelas;

  const resultado = await prisma.$transaction(async (tx) => {
    const compra = await tx.compraParcelada.create({
      data: {
        descricao: descricaoLimpa,
        valorTotal: valor,
        totalParcelas: parcelas,
        formaPagamento: formaPagamentoFinal,
        categoria: categoriaLimpa,
        dataCompra: dataBase,
      },
    });

    const despesasCriadas = [];
    for (let i = 0; i < parcelas; i++) {
      const centavos = centavosPorParcela + (i === parcelas - 1 ? restoCentavos : 0);
      const ano = dataBase.getUTCFullYear();
      const mes = dataBase.getUTCMonth() + i;
      const dia = Math.min(dataBase.getUTCDate(), ultimoDiaDoMes(ano, mes));
      const dataParcela = new Date(Date.UTC(ano, mes, dia));

      const despesa = await tx.despesaGeral.create({
        data: {
          descricao: `${descricaoLimpa} (${i + 1}/${parcelas})`,
          valor: centavos / 100,
          categoria: categoriaLimpa,
          dataDespesa: dataParcela,
          formaPagamento: formaPagamentoFinal,
          pago: false,
          compraParceladaId: compra.id,
          numeroParcela: i + 1,
        },
      });
      despesasCriadas.push(despesa);
    }

    return { compra, despesas: despesasCriadas };
  });

  return res.status(201).json(resultado);
}

async function listar(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query, { obrigatorio: false });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  await gerarDespesasRecorrentesPendentes();
  await gerarParcelasProLaborePendentes();

  // A data que importa pra listar/filtrar/ordenar despesas e o vencimento,
  // quando ele existe - senao, a data da despesa. Antes o filtro e a
  // ordenacao usavam sempre data_despesa, entao uma despesa lancada hoje
  // com vencimento no mes que vem nao aparecia no periodo certo (mesma
  // logica de COALESCE ja usada em relatorioController.alertas pras
  // "despesas vencidas").
  const filtroPeriodo =
    dataDe && dataAteExclusiva
      ? Prisma.sql`WHERE COALESCE(d.data_vencimento, d.data_despesa) >= ${dataDe} AND COALESCE(d.data_vencimento, d.data_despesa) < ${dataAteExclusiva}`
      : Prisma.empty;

  const linhas = await prisma.$queryRaw`
    SELECT
      d.id, d.descricao, d.valor, d.categoria, d.recorrente,
      d.data_fim_recorrencia AS "dataFimRecorrencia",
      d.despesa_origem_id AS "despesaOrigemId",
      d.pago, d.data_pagamento AS "dataPagamento",
      d.data_vencimento AS "dataVencimento",
      d.data_despesa AS "dataDespesa",
      d.compra_insumo_id AS "compraInsumoId",
      d.pro_labore_id AS "proLaboreId",
      d.compra_parcelada_id AS "compraParceladaId",
      d.numero_parcela AS "numeroParcela",
      d.forma_pagamento AS "formaPagamento",
      d.created_at AS "createdAt",
      ci.insumo_id AS "compraInsumoInsumoId",
      cp.total_parcelas AS "compraParceladaTotalParcelas"
    FROM despesas_gerais d
    LEFT JOIN compras_insumo ci ON ci.id = d.compra_insumo_id
    LEFT JOIN compras_parceladas cp ON cp.id = d.compra_parcelada_id
    ${filtroPeriodo}
    ORDER BY COALESCE(d.data_vencimento, d.data_despesa) DESC
  `;

  const despesas = linhas.map(({ compraInsumoInsumoId, compraParceladaTotalParcelas, ...despesa }) => ({
    ...despesa,
    compraInsumo: compraInsumoInsumoId !== null ? { insumoId: compraInsumoInsumoId } : null,
    compraParcelada: compraParceladaTotalParcelas !== null ? { totalParcelas: compraParceladaTotalParcelas } : null,
  }));

  return res.json(despesas);
}

async function detalhe(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const despesa = await prisma.despesaGeral.findUnique({
    where: { id },
    include: { compraInsumo: { select: { insumoId: true } } },
  });
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
  if (despesaAntes.compraInsumoId !== null) {
    return res.status(409).json({ error: ERRO_DESPESA_DE_COMPRA });
  }
  if (despesaAntes.proLaboreId !== null) {
    return res.status(409).json({ error: ERRO_DESPESA_DE_PRO_LABORE });
  }
  if (despesaAntes.compraParceladaId !== null) {
    return res.status(409).json({ error: ERRO_DESPESA_PARCELADA });
  }

  const { descricao, valor, categoria, dataDespesa, recorrente, dataFimRecorrencia, dataVencimento, formaPagamento } =
    req.body;
  const data = {};
  if (descricao !== undefined) data.descricao = descricao.trim();
  if (formaPagamento !== undefined) data.formaPagamento = formaPagamento ? formaPagamento.trim() : null;
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
  if (despesa.compraInsumoId !== null) {
    return res.status(409).json({ error: ERRO_DESPESA_DE_COMPRA });
  }
  if (despesa.proLaboreId !== null) {
    return res.status(409).json({ error: ERRO_DESPESA_DE_PRO_LABORE });
  }
  if (despesa.compraParceladaId !== null) {
    const parcelas = await prisma.despesaGeral.findMany({
      where: { compraParceladaId: despesa.compraParceladaId },
    });
    if (parcelas.some((p) => p.pago)) {
      return res.status(409).json({
        error: "Essa compra parcelada já tem parcela(s) paga(s) - não é possível remover.",
      });
    }
    await prisma.$transaction([
      prisma.despesaGeral.deleteMany({ where: { compraParceladaId: despesa.compraParceladaId } }),
      prisma.compraParcelada.delete({ where: { id: despesa.compraParceladaId } }),
    ]);
    return res.status(204).send();
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

  const despesa = await prisma.despesaGeral.findUnique({ where: { id } });
  if (!despesa) {
    return res.status(404).json({ error: "Despesa nao encontrada" });
  }
  if (despesa.compraInsumoId !== null) {
    return res.status(409).json({ error: ERRO_DESPESA_DE_COMPRA });
  }

  const atualizada = await prisma.despesaGeral.update({
    where: { id },
    data: { pago: true, dataPagamento: new Date() },
  });
  return res.json(atualizada);
}

async function marcarComoEmAberto(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const despesa = await prisma.despesaGeral.findUnique({ where: { id } });
  if (!despesa) {
    return res.status(404).json({ error: "Despesa nao encontrada" });
  }
  if (despesa.compraInsumoId !== null) {
    return res.status(409).json({ error: ERRO_DESPESA_DE_COMPRA });
  }

  const atualizada = await prisma.despesaGeral.update({
    where: { id },
    data: { pago: false, dataPagamento: null },
  });
  return res.json(atualizada);
}

module.exports = {
  criar,
  criarParcelada,
  listar,
  detalhe,
  editar,
  remover,
  marcarComoPaga,
  marcarComoEmAberto,
};
