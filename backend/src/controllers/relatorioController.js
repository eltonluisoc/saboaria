const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const { parsePeriodo } = require("../utils/periodo");
const { gerarDespesasRecorrentesPendentes } = require("../services/despesaService");

async function vendasDespesas(req, res) {
  const { erro, dataDe, dataAteExclusiva } = parsePeriodo(req.query);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  await gerarDespesasRecorrentesPendentes();

  const [vendas, despesas] = await Promise.all([
    prisma.pedido.aggregate({
      where: { status: "pago", dataPedido: { gte: dataDe, lt: dataAteExclusiva } },
      _sum: { valorTotal: true },
    }),
    prisma.despesaGeral.aggregate({
      where: { dataDespesa: { gte: dataDe, lt: dataAteExclusiva } },
      _sum: { valor: true },
    }),
  ]);

  const totalVendas = vendas._sum.valorTotal || new Prisma.Decimal(0);
  const totalDespesas = despesas._sum.valor || new Prisma.Decimal(0);
  const lucro = totalVendas.minus(totalDespesas);

  return res.json({
    periodo: { de: req.query.de, ate: req.query.ate },
    totalVendas,
    totalDespesas,
    lucro,
  });
}

module.exports = { vendasDespesas };
