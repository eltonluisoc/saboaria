// Script de execucao unica: cria despesas retroativas pras compras de
// insumo que existiam antes da geracao automatica de despesa (feature
// adicionada depois). Idempotente - so processa compras sem despesa
// vinculada, entao rodar de novo nao duplica nada.
require("../src/config/env");
const { Prisma } = require("@prisma/client");
const prisma = require("../src/config/prisma");

async function main() {
  const compras = await prisma.compraInsumo.findMany({
    where: { despesaGerada: null },
    include: { insumo: { select: { nome: true } } },
    orderBy: { dataCompra: "asc" },
  });

  console.log(`Encontrada(s) ${compras.length} compra(s) de insumo sem despesa vinculada.\n`);

  let criadas = 0;
  let somaTotal = new Prisma.Decimal(0);

  for (const compra of compras) {
    const valor = new Prisma.Decimal(compra.quantidade).times(compra.precoUnitario).toDecimalPlaces(2);

    await prisma.despesaGeral.create({
      data: {
        descricao: `Compra de insumo: ${compra.insumo.nome}`,
        valor,
        categoria: "Compra de insumo",
        dataDespesa: compra.dataCompra,
        pago: true,
        dataPagamento: compra.dataCompra,
        compraInsumoId: compra.id,
      },
    });

    criadas++;
    somaTotal = somaTotal.plus(valor);
    console.log(
      `  #${compra.id} ${compra.insumo.nome} - R$${valor.toFixed(2)} (${compra.dataCompra.toISOString().slice(0, 10)})`
    );
  }

  console.log(`\n${criadas} despesa(s) criada(s) retroativamente, somando R$${somaTotal.toFixed(2)}.`);
}

main()
  .catch((err) => {
    console.error("Erro:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
