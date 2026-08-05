const prisma = require("../config/prisma");
const {
  recalcularCustoInsumo,
  recalcularProdutosPorInsumo,
} = require("../services/custoService");

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarInsumoBody(body) {
  const { nome, unidadeMedida, quantidadeInicial, precoUnitarioInicial } = body || {};
  if (typeof nome !== "string" || !nome.trim()) {
    return "Campo 'nome' e obrigatorio";
  }
  if (typeof unidadeMedida !== "string" || !unidadeMedida.trim()) {
    return "Campo 'unidadeMedida' e obrigatorio";
  }

  const temQuantidade = quantidadeInicial !== undefined && quantidadeInicial !== null;
  const temPreco = precoUnitarioInicial !== undefined && precoUnitarioInicial !== null;

  if (temQuantidade !== temPreco) {
    return "'quantidadeInicial' e 'precoUnitarioInicial' devem ser preenchidos juntos";
  }

  if (temQuantidade) {
    const qtd = Number(quantidadeInicial);
    const preco = Number(precoUnitarioInicial);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      return "Campo 'quantidadeInicial' deve ser um numero maior que zero";
    }
    if (!Number.isFinite(preco) || preco < 0) {
      return "Campo 'precoUnitarioInicial' deve ser um numero maior ou igual a zero";
    }
  }

  return null;
}

async function criar(req, res) {
  const erro = validarInsumoBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { nome, unidadeMedida, quantidadeInicial, precoUnitarioInicial } = req.body;
  const temCompraInicial = quantidadeInicial !== undefined && quantidadeInicial !== null;

  if (!temCompraInicial) {
    const insumo = await prisma.insumo.create({
      data: { nome: nome.trim(), unidadeMedida: unidadeMedida.trim() },
    });
    return res.status(201).json(insumo);
  }

  const insumo = await prisma.$transaction(async (tx) => {
    const novoInsumo = await tx.insumo.create({
      data: { nome: nome.trim(), unidadeMedida: unidadeMedida.trim() },
    });

    await tx.compraInsumo.create({
      data: {
        insumoId: novoInsumo.id,
        quantidade: quantidadeInicial,
        precoUnitario: precoUnitarioInicial,
        dataCompra: new Date(),
      },
    });

    await tx.insumo.update({
      where: { id: novoInsumo.id },
      data: { estoqueAtual: { increment: quantidadeInicial } },
    });

    await recalcularCustoInsumo(tx, novoInsumo.id);

    return tx.insumo.findUnique({ where: { id: novoInsumo.id } });
  });

  return res.status(201).json(insumo);
}

async function listar(req, res) {
  const insumos = await prisma.insumo.findMany({ orderBy: { nome: "asc" } });
  return res.json(insumos);
}

async function detalhe(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const insumo = await prisma.insumo.findUnique({ where: { id } });
  if (!insumo) {
    return res.status(404).json({ error: "Insumo nao encontrado" });
  }

  return res.json(insumo);
}

async function editar(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const erro = validarInsumoBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { nome, unidadeMedida } = req.body;

  try {
    const insumo = await prisma.insumo.update({
      where: { id },
      data: { nome: nome.trim(), unidadeMedida: unidadeMedida.trim() },
    });
    return res.json(insumo);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Insumo nao encontrado" });
    }
    throw err;
  }
}

async function remover(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const [compras, receitas] = await Promise.all([
    prisma.compraInsumo.count({ where: { insumoId: id } }),
    prisma.produtoInsumo.count({ where: { insumoId: id } }),
  ]);

  if (compras > 0 || receitas > 0) {
    return res.status(409).json({
      error: "Insumo em uso (possui compras ou receitas vinculadas) e nao pode ser removido",
    });
  }

  try {
    await prisma.insumo.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Insumo nao encontrado" });
    }
    throw err;
  }
}

function validarCompraBody(body) {
  const { quantidade, precoUnitario, dataCompra } = body || {};
  const qtd = Number(quantidade);
  const preco = Number(precoUnitario);

  if (!Number.isFinite(qtd) || qtd <= 0) {
    return "Campo 'quantidade' deve ser um numero maior que zero";
  }
  if (!Number.isFinite(preco) || preco < 0) {
    return "Campo 'precoUnitario' deve ser um numero maior ou igual a zero";
  }
  if (!dataCompra || Number.isNaN(Date.parse(dataCompra))) {
    return "Campo 'dataCompra' invalido";
  }
  return null;
}

async function registrarCompra(req, res) {
  const insumoId = parseId(req.params.id);
  if (!insumoId) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const erro = validarCompraBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const insumoExiste = await prisma.insumo.findUnique({ where: { id: insumoId } });
  if (!insumoExiste) {
    return res.status(404).json({ error: "Insumo nao encontrado" });
  }

  const { quantidade, precoUnitario, dataCompra } = req.body;

  const resultado = await prisma.$transaction(async (tx) => {
    const compra = await tx.compraInsumo.create({
      data: {
        insumoId,
        quantidade,
        precoUnitario,
        dataCompra: new Date(dataCompra),
      },
    });

    await tx.insumo.update({
      where: { id: insumoId },
      data: { estoqueAtual: { increment: quantidade } },
    });

    const custoUnitarioAtual = await recalcularCustoInsumo(tx, insumoId);
    await recalcularProdutosPorInsumo(tx, insumoId);

    return { compra, custoUnitarioAtual };
  });

  return res.status(201).json(resultado);
}

async function listarCompras(req, res) {
  const insumoId = parseId(req.params.id);
  if (!insumoId) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const insumoExiste = await prisma.insumo.findUnique({ where: { id: insumoId } });
  if (!insumoExiste) {
    return res.status(404).json({ error: "Insumo nao encontrado" });
  }

  const compras = await prisma.compraInsumo.findMany({
    where: { insumoId },
    orderBy: [{ dataCompra: "asc" }, { id: "asc" }],
  });

  return res.json(compras);
}

module.exports = {
  criar,
  listar,
  detalhe,
  editar,
  remover,
  registrarCompra,
  listarCompras,
};
