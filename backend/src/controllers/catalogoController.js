const prisma = require("../config/prisma");

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  descricao: true,
  imagemUrl: true,
  precoVenda: true,
};

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listar(req, res) {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    select: CAMPOS_PUBLICOS,
    orderBy: { nome: "asc" },
  });

  return res.json(produtos);
}

async function detalhe(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Id invalido" });
  }

  const produto = await prisma.produto.findFirst({
    where: { id, ativo: true },
    select: CAMPOS_PUBLICOS,
  });

  if (!produto) {
    return res.status(404).json({ error: "Produto nao encontrado" });
  }

  return res.json(produto);
}

module.exports = { listar, detalhe };
