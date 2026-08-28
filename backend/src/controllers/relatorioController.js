const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");
const { gerarDespesasRecorrentesPendentes } = require("../services/despesaService");

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

  const [vendas, despesasPagas, despesasEmAberto] = await Promise.all([
    prisma.pedido.aggregate({
      where: { status: { in: STATUS_VENDA_CONFIRMADA }, dataPedido: { gte: dataDe, lt: dataAteExclusiva } },
      _sum: { valorTotal: true },
    }),
    prisma.despesaGeral.aggregate({
      where: { dataDespesa: { gte: dataDe, lt: dataAteExclusiva }, pago: true },
      _sum: { valor: true },
    }),
    prisma.despesaGeral.aggregate({
      where: { dataDespesa: { gte: dataDe, lt: dataAteExclusiva }, pago: false },
      _sum: { valor: true },
    }),
  ]);

  const totalVendas = vendas._sum.valorTotal || new Prisma.Decimal(0);
  const totalDespesasPagas = despesasPagas._sum.valor || new Prisma.Decimal(0);
  const totalDespesasEmAberto = despesasEmAberto._sum.valor || new Prisma.Decimal(0);
  const lucro = totalVendas.minus(totalDespesasPagas);
  const margemLucro = totalVendas.isZero() ? new Prisma.Decimal(0) : lucro.dividedBy(totalVendas);

  return res.json({
    periodo: { de: req.query.de, ate: req.query.ate },
    totalVendas,
    totalDespesasPagas,
    totalDespesasEmAberto,
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

module.exports = { vendasDespesas, produtosMaisVendidos, alertas };
