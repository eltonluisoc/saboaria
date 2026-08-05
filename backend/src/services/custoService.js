async function recalcularCustoInsumo(tx, insumoId) {
  const [{ media }] = await tx.$queryRaw`
    SELECT COALESCE(SUM(quantidade * preco_unitario) / NULLIF(SUM(quantidade), 0), 0)::numeric(12,4) AS media
    FROM compras_insumo
    WHERE insumo_id = ${insumoId}
  `;

  await tx.insumo.update({
    where: { id: insumoId },
    data: { custoUnitarioAtual: media },
  });

  return media;
}

async function recalcularCustoProduto(tx, produtoId) {
  const [{ custo }] = await tx.$queryRaw`
    SELECT COALESCE(SUM(pi.quantidade_usada * i.custo_unitario_atual), 0)::numeric(12,4) AS custo
    FROM produto_insumo pi
    JOIN insumos i ON i.id = pi.insumo_id
    WHERE pi.produto_id = ${produtoId}
  `;

  await tx.produto.update({
    where: { id: produtoId },
    data: { custoMedio: custo },
  });

  return custo;
}

async function recalcularProdutosPorInsumo(tx, insumoId) {
  const receitas = await tx.produtoInsumo.findMany({
    where: { insumoId },
    select: { produtoId: true },
    distinct: ["produtoId"],
  });

  for (const { produtoId } of receitas) {
    await recalcularCustoProduto(tx, produtoId);
  }
}

// Rateio global e acumulado: soma de TODAS as despesas gerais ja registradas
// dividida pela soma de TODAS as unidades ja produzidas em lotes, de
// qualquer produto. Nao e por produto nem por periodo - muda pra todo
// mundo a cada nova despesa ou lote registrado, em qualquer lugar do sistema.
async function calcularCustoIndiretoPorUnidade(client) {
  const [{ custo_indireto: custoIndireto }] = await client.$queryRaw`
    SELECT COALESCE(
      (SELECT SUM(valor) FROM despesas_gerais) / NULLIF((SELECT SUM(quantidade_produzida) FROM lotes_producao), 0),
      0
    )::numeric(12,4) AS custo_indireto
  `;

  return custoIndireto;
}

module.exports = {
  recalcularCustoInsumo,
  recalcularCustoProduto,
  recalcularProdutosPorInsumo,
  calcularCustoIndiretoPorUnidade,
};
