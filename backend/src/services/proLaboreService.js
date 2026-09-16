const prisma = require("../config/prisma");

// Mesma janela rolante de 12 meses a frente de hoje que
// despesaService.gerarDespesasRecorrentesPendentes ja usa pra recorrencia
// generica (aluguel etc) - mantem consistencia com o que o usuario ja
// conhece do sistema.
const HORIZONTE_MESES = 12;

function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

// Roda ao carregar a tela de Pro-labore (e pode ser chamada logo apos criar
// a configuracao, pra ja gerar as parcelas na hora). Ao contrario da
// recorrencia generica, aqui a "origem" (pro_labore) nao e ela mesma uma
// parcela - entao a geracao comeca no proprio mes de criacao (mes 0),
// nao mes+1.
async function gerarParcelasPendentes() {
  const config = await prisma.proLabore.findFirst({ where: { ativo: true } });
  if (!config) return;

  const hoje = new Date();
  const horizonte = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + HORIZONTE_MESES, 1);

  const anoBase = config.createdAt.getUTCFullYear();
  let mes = config.createdAt.getUTCMonth();

  while (Date.UTC(anoBase, mes, 1) <= horizonte) {
    const dia = Math.min(config.diaPagamento, ultimoDiaDoMes(anoBase, mes));
    const dataParcela = new Date(Date.UTC(anoBase, mes, dia));

    const inicioMes = new Date(Date.UTC(anoBase, mes, 1));
    const inicioProximoMes = new Date(Date.UTC(anoBase, mes + 1, 1));

    const jaExiste = await prisma.despesaGeral.findFirst({
      where: { proLaboreId: config.id, dataDespesa: { gte: inicioMes, lt: inicioProximoMes } },
    });

    if (!jaExiste) {
      await prisma.despesaGeral.create({
        data: {
          descricao: "Pró-labore",
          categoria: "Pró-labore",
          valor: config.valor,
          dataDespesa: dataParcela,
          proLaboreId: config.id,
          pago: false,
        },
      });
    }

    mes += 1;
  }
}

// Chamada ao alterar o valor do pro-labore ja configurado. Diferente da
// recorrencia generica (que atualiza tudo "depois de hoje"), aqui o corte e
// o primeiro dia do MES QUE VEM - o mes atual mantem o valor antigo mesmo
// que ainda nao tenha sido pago, porque um reajuste de pro-labore vale a
// partir do proximo mes, nao retroativo ao mes corrente.
async function atualizarValor(novoValor) {
  const config = await prisma.proLabore.findFirst({ where: { ativo: true } });
  if (!config) return null;

  const hoje = new Date();
  const inicioProximoMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1));

  return prisma.$transaction(async (tx) => {
    const atualizado = await tx.proLabore.update({
      where: { id: config.id },
      data: { valor: novoValor },
    });

    await tx.despesaGeral.updateMany({
      where: { proLaboreId: config.id, pago: false, dataDespesa: { gte: inicioProximoMes } },
      data: { valor: novoValor },
    });

    return atualizado;
  });
}

module.exports = { gerarParcelasPendentes, atualizarValor };
