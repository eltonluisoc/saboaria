const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");
const { gerarDespesasRecorrentesPendentes } = require("../services/despesaService");
const { gerarParcelasPendentes: gerarParcelasProLaborePendentes } = require("../services/proLaboreService");

// Um pedido que avancou no fluxo (pago -> enviado -> concluido) continua
// sendo uma venda de verdade - so "pendente" (ainda nao pago) e "cancelado"
// nao contam como faturamento. Contar so status==='pago' fazia a venda
// sumir do relatorio assim que o pedido avancava de status.
const STATUS_VENDA_CONFIRMADA = ["pago", "enviado", "concluido"];

async function vendasDespesas(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  await gerarDespesasRecorrentesPendentes();
  await gerarParcelasProLaborePendentes();

  // Mesma logica de COALESCE(data_vencimento, data_despesa) usada na
  // listagem de despesas (despesaController.listar) e nos alertas do
  // Dashboard - uma despesa lancada num mes com vencimento no mes
  // seguinte precisa contar no periodo do vencimento, nao no do
  // lancamento. Pro-labore fica de fora dessas duas somas e ganha as
  // suas proprias (totalProLabore*) - e remuneracao do dono, nao custo
  // operacional, entao aparece separado no Dashboard (mas ainda entra no
  // calculo de lucro normalmente, igual qualquer despesa paga).
  const [
    vendas,
    [{ total: totalDespesasPagasRaw }],
    [{ total: totalDespesasEmAbertoRaw }],
    [{ total: totalProLaborePagoRaw }],
    [{ total: totalProLaboreEmAbertoRaw }],
  ] = await Promise.all([
    prisma.pedido.aggregate({
      where: { status: { in: STATUS_VENDA_CONFIRMADA }, dataPedido: { gte: dataDe, lt: dataAteExclusiva } },
      _sum: { valorTotal: true },
    }),
    prisma.$queryRaw`
      SELECT COALESCE(SUM(valor), 0)::numeric(12,2) AS total
      FROM despesas_gerais
      WHERE COALESCE(data_vencimento, data_despesa) >= ${dataDe} AND COALESCE(data_vencimento, data_despesa) < ${dataAteExclusiva}
        AND pago = true AND categoria IS DISTINCT FROM 'Pró-labore'
    `,
    prisma.$queryRaw`
      SELECT COALESCE(SUM(valor), 0)::numeric(12,2) AS total
      FROM despesas_gerais
      WHERE COALESCE(data_vencimento, data_despesa) >= ${dataDe} AND COALESCE(data_vencimento, data_despesa) < ${dataAteExclusiva}
        AND pago = false AND categoria IS DISTINCT FROM 'Pró-labore'
    `,
    prisma.$queryRaw`
      SELECT COALESCE(SUM(valor), 0)::numeric(12,2) AS total
      FROM despesas_gerais
      WHERE COALESCE(data_vencimento, data_despesa) >= ${dataDe} AND COALESCE(data_vencimento, data_despesa) < ${dataAteExclusiva}
        AND pago = true AND categoria = 'Pró-labore'
    `,
    prisma.$queryRaw`
      SELECT COALESCE(SUM(valor), 0)::numeric(12,2) AS total
      FROM despesas_gerais
      WHERE COALESCE(data_vencimento, data_despesa) >= ${dataDe} AND COALESCE(data_vencimento, data_despesa) < ${dataAteExclusiva}
        AND pago = false AND categoria = 'Pró-labore'
    `,
  ]);

  const totalVendas = vendas._sum.valorTotal || new Prisma.Decimal(0);
  const totalDespesasPagas = new Prisma.Decimal(totalDespesasPagasRaw);
  const totalDespesasEmAberto = new Prisma.Decimal(totalDespesasEmAbertoRaw);
  const totalProLaborePago = new Prisma.Decimal(totalProLaborePagoRaw);
  const totalProLaboreEmAberto = new Prisma.Decimal(totalProLaboreEmAbertoRaw);
  const lucro = totalVendas.minus(totalDespesasPagas).minus(totalProLaborePago);
  const margemLucro = totalVendas.isZero() ? new Prisma.Decimal(0) : lucro.dividedBy(totalVendas);

  return res.json({
    periodo: { de: req.query.de, ate: req.query.ate },
    totalVendas,
    totalDespesasPagas,
    totalDespesasEmAberto,
    totalProLaborePago,
    totalProLaboreEmAberto,
    lucro,
    margemLucro,
  });
}

async function produtosMaisVendidos(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const produtos = await prisma.$queryRaw`
    SELECT
      p.id AS "produtoId",
      p.nome,
      SUM(ip.quantidade)::int AS quantidade,
      SUM(ip.subtotal)::numeric(12,2) AS valor
    FROM itens_pedido ip
    JOIN pedidos pe ON pe.id = ip.pedido_id
    JOIN produtos p ON p.id = ip.produto_id
    WHERE pe.status IN ('pago', 'enviado', 'concluido') AND pe.data_pedido >= ${dataDe} AND pe.data_pedido < ${dataAteExclusiva}
    GROUP BY p.id, p.nome
    ORDER BY quantidade DESC
    LIMIT 10
  `;

  return res.json(produtos);
}

const DIA_MS = 24 * 60 * 60 * 1000;
const GRANULARIDADES_MEDIA = ["quinzenal", "mensal"];

function chaveDia(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

// Media de vendas por dia (em R$ e em unidades), sobre dias CORRIDOS - dia
// sem venda conta como zero. A media geral vai da data da 1a venda ate hoje
// (dias antes de comecar a vender nao entram, senao puxariam a media pra
// baixo). O historico divide em quinzenas de calendario (1-15 e 16-fim do
// mes) ou em meses; o 1o periodo conta so a partir da 1a venda e o periodo
// em andamento divide so pelos dias ja decorridos. Datas por dia em UTC,
// igual ao filtro de periodo do resto do Dashboard - assim cada periodo
// daqui bate com o mesmo intervalo selecionado em "Periodo selecionado".
async function mediaVendas(req, res) {
  const granularidade = req.query.granularidade || "quinzenal";
  if (!GRANULARIDADES_MEDIA.includes(granularidade)) {
    return res.status(400).json({ error: "Parametro 'granularidade' deve ser 'quinzenal' ou 'mensal'" });
  }

  const [valoresPorDia, unidadesPorDia] = await Promise.all([
    prisma.$queryRaw`
      SELECT pe.data_pedido::date AS dia, SUM(pe.valor_total)::numeric(12,2) AS valor
      FROM pedidos pe
      WHERE pe.status IN (${Prisma.join(STATUS_VENDA_CONFIRMADA)})
      GROUP BY 1
    `,
    prisma.$queryRaw`
      SELECT pe.data_pedido::date AS dia, SUM(ip.quantidade)::int AS unidades
      FROM itens_pedido ip
      JOIN pedidos pe ON pe.id = ip.pedido_id
      WHERE pe.status IN (${Prisma.join(STATUS_VENDA_CONFIRMADA)})
      GROUP BY 1
    `,
  ]);

  const agora = new Date();
  const hoje = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());

  // centavos inteiros: evita erro de ponto flutuante ao somar dinheiro
  const centavosPorDia = new Map();
  for (const { dia, valor } of valoresPorDia) {
    if (dia.getTime() <= hoje) centavosPorDia.set(chaveDia(dia.getTime()), Math.round(Number(valor) * 100));
  }
  const unidadesMapa = new Map();
  for (const { dia, unidades } of unidadesPorDia) {
    if (dia.getTime() <= hoje) unidadesMapa.set(chaveDia(dia.getTime()), Number(unidades));
  }

  const vazio = {
    primeiraVenda: null,
    dias: 0,
    totalValor: 0,
    totalUnidades: 0,
    mediaValorPorDia: 0,
    mediaUnidadesPorDia: 0,
    historico: [],
  };
  if (centavosPorDia.size === 0) {
    return res.json(vazio);
  }

  const primeira = Math.min(...[...centavosPorDia.keys()].map((k) => Date.parse(k)));

  function somarIntervalo(inicioMs, fimMs) {
    let centavos = 0;
    let unidades = 0;
    for (let ms = inicioMs; ms <= fimMs; ms += DIA_MS) {
      const chave = chaveDia(ms);
      centavos += centavosPorDia.get(chave) || 0;
      unidades += unidadesMapa.get(chave) || 0;
    }
    return { centavos, unidades };
  }

  function resumir(inicioMs, fimMs) {
    const dias = Math.round((fimMs - inicioMs) / DIA_MS) + 1;
    const { centavos, unidades } = somarIntervalo(inicioMs, fimMs);
    return {
      dias,
      totalValor: centavos / 100,
      totalUnidades: unidades,
      mediaValorPorDia: Math.round(centavos / dias) / 100,
      mediaUnidadesPorDia: Math.round((unidades / dias) * 100) / 100,
    };
  }

  const geral = resumir(primeira, hoje);

  // baldes de calendario do mes da 1a venda ate o mes de hoje
  const pIni = new Date(primeira);
  const historico = [];
  let ano = pIni.getUTCFullYear();
  let mes = pIni.getUTCMonth();
  while (Date.UTC(ano, mes, 1) <= hoje) {
    const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
    const faixas =
      granularidade === "quinzenal"
        ? [
            [1, 15],
            [16, ultimoDia],
          ]
        : [[1, ultimoDia]];

    for (const [diaIni, diaFim] of faixas) {
      const nominalIni = Date.UTC(ano, mes, diaIni);
      const nominalFim = Date.UTC(ano, mes, diaFim);
      if (nominalFim < primeira || nominalIni > hoje) continue;

      const inicioEfetivo = Math.max(nominalIni, primeira);
      const fimEfetivo = Math.min(nominalFim, hoje);
      historico.push({
        inicio: chaveDia(inicioEfetivo),
        fim: chaveDia(nominalFim),
        emAndamento: hoje >= nominalIni && hoje <= nominalFim,
        ...resumir(inicioEfetivo, fimEfetivo),
      });
    }

    mes += 1;
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }
  }

  return res.json({
    primeiraVenda: chaveDia(primeira),
    dias: geral.dias,
    totalValor: geral.totalValor,
    totalUnidades: geral.totalUnidades,
    mediaValorPorDia: geral.mediaValorPorDia,
    mediaUnidadesPorDia: geral.mediaUnidadesPorDia,
    historico,
  });
}

const DIAS_LIMITE_PEDIDO_PENDENTE = 3;

async function alertas(req, res) {
  await gerarDespesasRecorrentesPendentes();

  const hoje = new Date();
  const limitePedidoPendente = new Date(hoje);
  limitePedidoPendente.setDate(limitePedidoPendente.getDate() - DIAS_LIMITE_PEDIDO_PENDENTE);

  const [despesasVencidas, insumosBaixos, pedidosPendentes] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, descricao, valor, categoria, data_vencimento AS "dataVencimento", data_despesa AS "dataDespesa"
      FROM despesas_gerais
      WHERE pago = false AND COALESCE(data_vencimento, data_despesa) < ${hoje}
      ORDER BY COALESCE(data_vencimento, data_despesa) ASC
    `,
    prisma.insumo.findMany({
      where: { estoqueMinimo: { not: null } },
      orderBy: { nome: "asc" },
    }),
    prisma.pedido.findMany({
      where: { status: "pendente", dataPedido: { lt: limitePedidoPendente } },
      orderBy: { dataPedido: "asc" },
      include: { cliente: { select: { nome: true } } },
    }),
  ]);

  const insumosAbaixoDoMinimo = insumosBaixos.filter(
    (insumo) => Number(insumo.estoqueAtual) <= Number(insumo.estoqueMinimo)
  );

  return res.json({
    despesasVencidas,
    insumosAbaixoDoMinimo,
    pedidosPendentes,
  });
}

module.exports = { vendasDespesas, produtosMaisVendidos, mediaVendas, alertas };
