const prisma = require("../config/prisma");

function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

// Geracao sob demanda: roda toda vez que a lista de despesas ou o dashboard
// carrega. So olha despesas "originais" (recorrente=true, despesaOrigemId
// nulo) - uma gerada nunca vira template, entao nao ha geracao em cadeia.
async function gerarDespesasRecorrentesPendentes() {
  const originais = await prisma.despesaGeral.findMany({
    where: { recorrente: true, despesaOrigemId: null },
  });

  const hoje = new Date();
  const limiteAtual = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1);

  for (const original of originais) {
    const diaOriginal = original.dataDespesa.getUTCDate();
    const limiteFim = original.dataFimRecorrencia
      ? Date.UTC(
          original.dataFimRecorrencia.getUTCFullYear(),
          original.dataFimRecorrencia.getUTCMonth(),
          original.dataFimRecorrencia.getUTCDate()
        )
      : null;

    // anoBase fixo + mes acumulado sem normalizar: Date.UTC ja rola pra
    // frente sozinho quando o mes passa de 11, entao nao precisa de
    // carry manual (evita processar o mesmo mes duas vezes por engano).
    const anoBase = original.dataDespesa.getUTCFullYear();
    let mes = original.dataDespesa.getUTCMonth() + 1;

    while (Date.UTC(anoBase, mes, 1) <= limiteAtual) {
      const dia = Math.min(diaOriginal, ultimoDiaDoMes(anoBase, mes));
      const dataGerada = new Date(Date.UTC(anoBase, mes, dia));

      if (limiteFim !== null && dataGerada.getTime() > limiteFim) {
        break;
      }

      const inicioMes = new Date(Date.UTC(anoBase, mes, 1));
      const inicioProximoMes = new Date(Date.UTC(anoBase, mes + 1, 1));

      const jaExiste = await prisma.despesaGeral.findFirst({
        where: {
          despesaOrigemId: original.id,
          dataDespesa: { gte: inicioMes, lt: inicioProximoMes },
        },
      });

      if (!jaExiste) {
        await prisma.despesaGeral.create({
          data: {
            descricao: original.descricao,
            valor: original.valor,
            categoria: original.categoria,
            dataDespesa: dataGerada,
            recorrente: true,
            despesaOrigemId: original.id,
          },
        });
      }

      mes += 1;
    }
  }
}

module.exports = { gerarDespesasRecorrentesPendentes };
