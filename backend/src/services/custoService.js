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

// "quantidade_usada" na receita e por 1kg (1000g) de massa produzida, nao
// por unidade - assim trocar de molde e so questao de mudar o peso da
// unidade, sem recadastrar a receita inteira.
async function recalcularCustoProduto(tx, produtoId) {
  const [{ custo }] = await tx.$queryRaw`
    SELECT COALESCE(SUM(pi.quantidade_usada * i.custo_unitario_atual), 0)::numeric(12,4) AS custo
    FROM produto_insumo pi
    JOIN insumos i ON i.id = pi.insumo_id
    WHERE pi.produto_id = ${produtoId}
  `;

  const produto = await tx.produto.findUnique({
    where: { id: produtoId },
    select: { pesoUnidadeGramas: true },
  });
  const pesoGramas = produto?.pesoUnidadeGramas ? Number(produto.pesoUnidadeGramas) : 0;
  const custoPorKg = Number(custo);
  const custoMedio = (custoPorKg * pesoGramas) / 1000;

  await tx.produto.update({
    where: { id: produtoId },
    data: { custoMedio },
  });

  return { custoPorKg, custoMedio };
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

// Rateio global e acumulado: soma de TODAS as despesas gerais indiretas ja
// registradas dividida pela soma de TODAS as unidades ja produzidas em
// lotes, de qualquer produto. Nao e por produto nem por periodo - muda pra
// todo mundo a cada nova despesa ou lote registrado, em qualquer lugar do
// sistema.
//
// Despesa da categoria "Compra de insumo" fica de fora dessa soma de
// proposito: esse custo ja entra certinho, por produto, na receita
// (quantidade_usada x custo_unitario_atual do insumo, em recalcularCustoProduto).
// Somar de novo aqui contaria o mesmo insumo duas vezes no "custo completo" -
// uma vez preciso (pela receita) e outra diluido (pelo rateio geral). A
// despesa continua contando normalmente no Dashboard/total de despesas -
// so nao entra nessa conta especifica de rateio por unidade.
async function calcularCustoIndiretoPorUnidade(client) {
  const [{ custo_indireto: custoIndireto }] = await client.$queryRaw`
    SELECT COALESCE(
      (SELECT SUM(valor) FROM despesas_gerais WHERE categoria IS DISTINCT FROM 'Compra de insumo')
        / NULLIF((SELECT SUM(quantidade_produzida) FROM lotes_producao), 0),
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
