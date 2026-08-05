const prisma = require("../config/prisma");
const { recalcularCustoProduto, calcularCustoIndiretoPorUnidade } = require("../services/custoService");

async function comCustoCompleto(produto) {
  const custoIndiretoPorUnidade = Number(await calcularCustoIndiretoPorUnidade(prisma));

  if (Array.isArray(produto)) {
    return produto.map((p) => ({
      ...p,
      custoIndiretoPorUnidade,
      custoUnitarioCompleto: Number(p.custoMedio) + custoIndiretoPorUnidade,
    }));
  }

  return {
    ...produto,
    custoIndiretoPorUnidade,
    custoUnitarioCompleto: Number(produto.custoMedio) + custoIndiretoPorUnidade,
  };
}

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarProdutoBody(body, { partial = false } = {}) {
  const { nome, precoVenda, descricao, ativo, imagemUrl } = body || {};

  if (!partial || nome !== undefined) {
    if (typeof nome !== "string" || !nome.trim()) {
      return "Campo 'nome' e obrigatorio";
    }
  }

  if (!partial || precoVenda !== undefined) {
    const preco = Number(precoVenda);
    if (!Number.isFinite(preco) || preco <= 0) {
      return "Campo 'precoVenda' deve ser um numero maior que zero";
    }
  }

  if (descricao !== undefined && descricao !== null && typeof descricao !== "string") {
    return "Campo 'descricao' deve ser texto";
  }

  if (ativo !== undefined && typeof ativo !== "boolean") {
    return "Campo 'ativo' deve ser booleano";
  }

  if (imagemUrl !== undefined && imagemUrl !== null && typeof imagemUrl !== "string") {
    return "Campo 'imagemUrl' deve ser texto";
  }

  return null;
}

async function criar(req, res) {
  const erro = validarProdutoBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { nome, descricao, precoVenda, ativo, imagemUrl } = req.body;

  const produto = await prisma.produto.create({
    data: {
      nome: nome.trim(),
      descricao: descricao ? descricao.trim() : null,
      imagemUrl: imagemUrl ? imagemUrl.trim() : null,
      precoVenda,
      ativo: ativo === undefined ? true : ativo,
    },
  });

  return res.status(201).json(produto);
}

async function listar(req, res) {
  const produtos = await prisma.produto.findMany({ orderBy: { nome: "asc" } });
  return res.json(await comCustoCompleto(produtos));
}

async function detalhe(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: { receita: { include: { insumo: true } } },
  });

  if (!produto) {
    return res.status(404).json({ error: "Produto nao encontrado" });
  }

  return res.json(await comCustoCompleto(produto));
}

async function editar(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const erro = validarProdutoBody(req.body, { partial: true });
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { nome, descricao, precoVenda, ativo, imagemUrl } = req.body;
  const data = {};
  if (nome !== undefined) data.nome = nome.trim();
  if (descricao !== undefined) data.descricao = descricao ? descricao.trim() : null;
  if (precoVenda !== undefined) data.precoVenda = precoVenda;
  if (ativo !== undefined) data.ativo = ativo;
  if (imagemUrl !== undefined) data.imagemUrl = imagemUrl ? imagemUrl.trim() : null;

  try {
    const produto = await prisma.produto.update({ where: { id }, data });
    return res.json(produto);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Produto nao encontrado" });
    }
    throw err;
  }
}

async function remover(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const pedidos = await prisma.itemPedido.count({ where: { produtoId: id } });
  if (pedidos > 0) {
    return res.status(409).json({
      error: "Produto em uso (possui pedidos vinculados) e nao pode ser removido",
    });
  }

  try {
    await prisma.produto.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Produto nao encontrado" });
    }
    throw err;
  }
}

function validarReceitaBody(body) {
  if (!Array.isArray(body)) {
    return "O corpo da requisicao deve ser uma lista de itens da receita";
  }

  const idsVistos = new Set();

  for (const item of body) {
    const insumoId = Number(item?.insumoId);
    const quantidadeUsada = Number(item?.quantidadeUsada);

    if (!Number.isInteger(insumoId) || insumoId <= 0) {
      return "Cada item precisa de um 'insumoId' valido";
    }
    if (!Number.isFinite(quantidadeUsada) || quantidadeUsada <= 0) {
      return "Cada item precisa de 'quantidadeUsada' maior que zero";
    }
    if (idsVistos.has(insumoId)) {
      return `Insumo ${insumoId} aparece mais de uma vez na receita`;
    }
    idsVistos.add(insumoId);
  }

  return null;
}

async function substituirReceita(req, res) {
  const produtoId = parseId(req.params.id);
  if (!produtoId) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const produtoExiste = await prisma.produto.findUnique({ where: { id: produtoId } });
  if (!produtoExiste) {
    return res.status(404).json({ error: "Produto nao encontrado" });
  }

  const erro = validarReceitaBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const itens = req.body;
  const insumoIds = itens.map((item) => Number(item.insumoId));

  if (insumoIds.length > 0) {
    const insumosExistentes = await prisma.insumo.findMany({
      where: { id: { in: insumoIds } },
      select: { id: true },
    });
    if (insumosExistentes.length !== new Set(insumoIds).size) {
      return res.status(400).json({ error: "Um ou mais 'insumoId' nao existem" });
    }
  }

  const produto = await prisma.$transaction(async (tx) => {
    await tx.produtoInsumo.deleteMany({ where: { produtoId } });

    if (itens.length > 0) {
      await tx.produtoInsumo.createMany({
        data: itens.map((item) => ({
          produtoId,
          insumoId: Number(item.insumoId),
          quantidadeUsada: item.quantidadeUsada,
        })),
      });
    }

    await recalcularCustoProduto(tx, produtoId);

    return tx.produto.findUnique({
      where: { id: produtoId },
      include: { receita: { include: { insumo: true } } },
    });
  });

  return res.json(produto);
}

module.exports = {
  criar,
  listar,
  detalhe,
  editar,
  remover,
  substituirReceita,
};
