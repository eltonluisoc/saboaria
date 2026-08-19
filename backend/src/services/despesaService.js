const prisma = require("../config/prisma");

// Sem data de fim, gera essa quantidade de meses a frente de hoje (janela
// rolante - avanca sozinha com o tempo, a cada chamada desta funcao).
const HORIZONTE_MESES_SEM_FIM = 12;

function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

function inicioDoDiaUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Roda toda vez que a lista de despesas ou o dashboard carrega, e tambem logo
// apos criar/editar uma despesa recorrente (pra ja projetar os meses futuros
// na hora, em vez de so ir aparecendo mes a mes). So olha despesas
// "originais" (recorrente=true, despesaOrigemId nulo) - uma gerada nunca
// vira template, entao nao ha geracao em cadeia.
async function gerarDespesasRecorrentesPendentes() {
  const originais = await prisma.despesaGeral.findMany({
    where: { recorrente: true, despesaOrigemId: null },
  });

  const hoje = new Date();
  const horizonteSemFim = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + HORIZONTE_MESES_SEM_FIM, 1);

  for (const original of originais) {
    const diaOriginal = original.dataDespesa.getUTCDate();
    const limiteFim = original.dataFimRecorrencia
      ? Date.UTC(
          original.dataFimRecorrencia.getUTCFullYear(),
          original.dataFimRecorrencia.getUTCMonth(),
          original.dataFimRecorrencia.getUTCDate()
        )
      : null;

    // Com data de fim, gera tudo de uma vez ate ela (mesmo que passe do
    // horizonte padrao de 12 meses). Sem data de fim, so ate o horizonte
    // rolante. O "limiteFim" logo abaixo, dentro do loop, e quem realmente
    // trunca a geracao no mes certo quando ele for mais curto que isso.
    const limiteAtual = limiteFim !== null ? Math.max(limiteFim, horizonteSemFim) : horizonteSemFim;

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

// Chamada logo apos editar uma despesa-origem (despesaOrigemId nulo).
// "antes"/"depois" sao o registro pre e pos-edicao. So mexe em ocorrencias
// futuras ainda nao pagas (projecoes) - as que ja aconteceram (passadas ou
// de hoje) ficam intocadas, preservando o historico.
async function sincronizarOcorrenciasFuturasDaOrigem(tx, antes, depois) {
  const hojeUTC = inicioDoDiaUTC(new Date());

  if (!depois.recorrente) {
    // Parou de ser recorrente: as projecoes futuras deixam de fazer sentido.
    await tx.despesaGeral.deleteMany({
      where: { despesaOrigemId: depois.id, pago: false, dataDespesa: { gt: hojeUTC } },
    });
    return;
  }

  const mudouValores =
    antes.descricao !== depois.descricao ||
    Number(antes.valor) !== Number(depois.valor) ||
    antes.categoria !== depois.categoria;

  if (mudouValores) {
    await tx.despesaGeral.updateMany({
      where: { despesaOrigemId: depois.id, pago: false, dataDespesa: { gt: hojeUTC } },
      data: { descricao: depois.descricao, valor: depois.valor, categoria: depois.categoria },
    });
  }

  if (depois.dataFimRecorrencia) {
    const corte = depois.dataFimRecorrencia > hojeUTC ? depois.dataFimRecorrencia : hojeUTC;
    await tx.despesaGeral.deleteMany({
      where: { despesaOrigemId: depois.id, pago: false, dataDespesa: { gt: corte } },
    });
  }
}

module.exports = { gerarDespesasRecorrentesPendentes, sincronizarOcorrenciasFuturasDaOrigem };
