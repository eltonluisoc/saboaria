function parsePeriodo({ de, ate }, { obrigatorio = true } = {}) {
  if (!de && !ate) {
    if (obrigatorio) {
      return { erro: "Parametros 'de' e 'ate' sao obrigatorios (formato AAAA-MM-DD)" };
    }
    return {};
  }

  if (!de || !ate) {
    return { erro: "Informe 'de' e 'ate' juntos (formato AAAA-MM-DD)" };
  }

  const dataDe = new Date(de);
  const dataAteExclusiva = new Date(ate);

  if (Number.isNaN(dataDe.getTime()) || Number.isNaN(dataAteExclusiva.getTime())) {
    return { erro: "Parametros 'de'/'ate' invalidos" };
  }

  // 'ate' cobre o dia inteiro: desloca pro inicio do dia seguinte e filtra com "lt".
  dataAteExclusiva.setUTCDate(dataAteExclusiva.getUTCDate() + 1);

  return { dataDe, dataAteExclusiva };
}

module.exports = { parsePeriodo };
