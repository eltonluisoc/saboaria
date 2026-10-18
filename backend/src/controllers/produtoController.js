const prisma = require("../config/prisma");
const {
  recalcularCustoProduto,
  recalcularCustoKit,
  calcularCustoIndiretoPorUnidade,
} = require("../services/custoService");

// Quando a receita vem carregada (detalhe), soma só os itens "por kg de
// massa" (porUnidade=false) direto - preciso mesmo com embalagem (porUnidade
// true) misturada na receita. Sem a receita carregada (listar, que não
// inclui receita por ser uma lista de todos os produtos), cai pro cálculo
// inverso de antes a partir do custoMedio - fica impreciso só nesse caso
// pra produtos que já tem item por unidade na receita.
function calcularCustoPorKgMassa(produto) {
  const peso = Number(produto.pesoUnidadeGramas);
  if (!peso) return 0;

  if (Array.isArray(produto.receita)) {
    return produto.receita
      .filter((item) => !item.porUnidade)
      .reduce((soma, item) => soma + Number(item.quantidadeUsada) * Number(item.insumo.custoUnitarioAtual), 0);
  }

  return (Number(produto.custoMedio) * 1000) / peso;
}

// So pra exibicao no admin - quantos kits dao pra montar com o estoque
// atual de cada componente (o menor entre eles manda). Nao grava nada; o
// estoqueAtual bruto do proprio kit fica sem uso (nunca incrementado por
// lote de producao, que e so pra produto simples).
function calcularEstoqueDisponivelKit(produto) {
  if (!produto.ehKit || !produto.composicaoKit || produto.composicaoKit.length === 0) {
    return null;
  }
  return produto.composicaoKit.reduce((min, item) => {
    const disponivel = Math.floor(Number(item.produto.estoqueAtual) / item.quantidade);
    return min === null ? disponivel : Math.min(min, disponivel);
  }, null);
}

async function comCustoCompleto(produto) {
  const custoIndiretoPorUnidade = Number(await calcularCustoIndiretoPorUnidade(prisma));

  if (Array.isArray(produto)) {
    return produto.map((p) => ({
      ...p,
      custoIndiretoPorUnidade,
      custoUnitarioCompleto: Number(p.custoMedio) + custoIndiretoPorUnidade,
      custoPorKgMassa: calcularCustoPorKgMassa(p),
      estoqueDisponivelKit: calcularEstoqueDisponivelKit(p),
    }));
  }

  return {
    ...produto,
    custoIndiretoPorUnidade,
    custoUnitarioCompleto: Number(produto.custoMedio) + custoIndiretoPorUnidade,
    custoPorKgMassa: calcularCustoPorKgMassa(produto),
    estoqueDisponivelKit: calcularEstoqueDisponivelKit(produto),
  };
}

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarProdutoBody(body, { partial = false } = {}) {
  const { nome, precoVenda, descricao, ativo, emBreve, ehKit, imagemUrl, pesoUnidadeGramas } = body || {};

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

  if (emBreve !== undefined && typeof emBreve !== "boolean") {
    return "Campo 'emBreve' deve ser booleano";
  }

  if (ehKit !== undefined && typeof ehKit !== "boolean") {
    return "Campo 'ehKit' deve ser booleano";
  }

  if (imagemUrl !== undefined && imagemUrl !== null && typeof imagemUrl !== "string") {
    return "Campo 'imagemUrl' deve ser texto";
  }

  if (pesoUnidadeGramas !== undefined && pesoUnidadeGramas !== null) {
    const peso = Number(pesoUnidadeGramas);
    if (!Number.isFinite(peso) || peso <= 0) {
      return "Campo 'pesoUnidadeGramas' deve ser um numero maior que zero";
    }
  }

  return null;
}

async function criar(req, res) {
  const erro = validarProdutoBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { nome, descricao, precoVenda, ativo, emBreve, ehKit, imagemUrl, pesoUnidadeGramas } = req.body;

  const produto = await prisma.produto.create({
    data: {
      nome: nome.trim(),
      descricao: descricao ? descricao.trim() : null,
      imagemUrl: imagemUrl ? imagemUrl.trim() : null,
      precoVenda,
      pesoUnidadeGramas: pesoUnidadeGramas || null,
      ativo: ativo === undefined ? true : ativo,
      emBreve: emBreve === undefined ? false : emBreve,
      ehKit: ehKit === undefined ? false : ehKit,
    },
  });

  return res.status(201).json(produto);
}

async function listar(req, res) {
  const produtos = await prisma.produto.findMany({
    orderBy: { nome: "asc" },
    include: { composicaoKit: { include: { produto: { select: { estoqueAtual: true } } } } },
  });
  return res.json(await comCustoCompleto(produtos));
}

async function detalhe(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: {
      receita: { include: { insumo: true } },
      composicaoKit: { include: { produto: true } },
    },
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

  const { nome, descricao, precoVenda, ativo, emBreve, ehKit, imagemUrl, pesoUnidadeGramas } = req.body;
  const data = {};
  if (nome !== undefined) data.nome = nome.trim();
  if (descricao !== undefined) data.descricao = descricao ? descricao.trim() : null;
  if (precoVenda !== undefined) data.precoVenda = precoVenda;
  if (ativo !== undefined) data.ativo = ativo;
  if (emBreve !== undefined) data.emBreve = emBreve;
  if (ehKit !== undefined) data.ehKit = ehKit;
  if (imagemUrl !== undefined) data.imagemUrl = imagemUrl ? imagemUrl.trim() : null;
  if (pesoUnidadeGramas !== undefined) data.pesoUnidadeGramas = pesoUnidadeGramas || null;

  try {
    const produto = await prisma.$transaction(async (tx) => {
      await tx.produto.update({ where: { id }, data });
      // custoMedio (por unidade) depende do peso, entao recalcula se ele mudou
      if (pesoUnidadeGramas !== undefined) {
        await recalcularCustoProduto(tx, id);
      }
      return tx.produto.findUnique({ where: { id } });
    });
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
    if (item?.porUnidade !== undefined && typeof item.porUnidade !== "boolean") {
      return "Campo 'porUnidade' deve ser booleano";
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
  const temItemPorPeso = itens.some((item) => !item.porUnidade);

  if (temItemPorPeso && !produtoExiste.pesoUnidadeGramas) {
    return res.status(400).json({
      error: "Defina o peso por unidade (g) do produto antes de cadastrar um item por kg de massa",
    });
  }

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
          porUnidade: item.porUnidade === true,
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

function validarComposicaoKitBody(body) {
  if (!Array.isArray(body)) {
    return "O corpo da requisicao deve ser uma lista de itens do kit";
  }

  const idsVistos = new Set();

  for (const item of body) {
    const produtoId = Number(item?.produtoId);
    const quantidade = Number(item?.quantidade);

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      return "Cada item precisa de um 'produtoId' valido";
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return "Cada item precisa de 'quantidade' inteira maior que zero";
    }
    if (idsVistos.has(produtoId)) {
      return `Produto ${produtoId} aparece mais de uma vez no kit`;
    }
    idsVistos.add(produtoId);
  }

  return null;
}

// Composicao de um kit e a "receita" dele, so que de outros Produtos em vez
// de Insumos - mesmo padrao de substituirReceita (substitui a lista inteira
// de uma vez). So aceita 1 nivel (nenhum componente pode ser ele mesmo um
// kit) - evita kit-de-kit, fora do escopo por enquanto.
async function substituirComposicaoKit(req, res) {
  const kitId = parseId(req.params.id);
  if (!kitId) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const kit = await prisma.produto.findUnique({ where: { id: kitId } });
  if (!kit) {
    return res.status(404).json({ error: "Produto nao encontrado" });
  }
  if (!kit.ehKit) {
    return res.status(400).json({ error: "Esse produto nao esta marcado como kit" });
  }

  const erro = validarComposicaoKitBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const itens = req.body;

  if (itens.some((item) => Number(item.produtoId) === kitId)) {
    return res.status(400).json({ error: "Um kit nao pode conter ele mesmo" });
  }

  const produtoIds = itens.map((item) => Number(item.produtoId));

  if (produtoIds.length > 0) {
    const componentes = await prisma.produto.findMany({
      where: { id: { in: produtoIds } },
      select: { id: true, ehKit: true },
    });
    if (componentes.length !== new Set(produtoIds).size) {
      return res.status(400).json({ error: "Um ou mais 'produtoId' nao existem" });
    }
    if (componentes.some((c) => c.ehKit)) {
      return res.status(400).json({ error: "Um kit nao pode conter outro kit como componente" });
    }
  }

  const produto = await prisma.$transaction(async (tx) => {
    await tx.kitItem.deleteMany({ where: { kitId } });

    if (itens.length > 0) {
      await tx.kitItem.createMany({
        data: itens.map((item) => ({
          kitId,
          produtoId: Number(item.produtoId),
          quantidade: Number(item.quantidade),
        })),
      });
    }

    await recalcularCustoKit(tx, kitId);

    return tx.produto.findUnique({
      where: { id: kitId },
      include: { composicaoKit: { include: { produto: true } } },
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
  substituirComposicaoKit,
};
