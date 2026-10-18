const prisma = require("../config/prisma");

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  descricao: true,
  imagemUrl: true,
  precoVenda: true,
  emBreve: true,
  ehKit: true,
};

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Saboaria e sabonete primeiro, sempre: sabonete em barra, depois sabonete
// liquido, depois o resto da colecao - nessa ordem em qualquer lista
// publica (catalogo e Home usam o mesmo endpoint).
async function listar(req, res) {
  const produtos = await prisma.$queryRaw`
    SELECT id, nome, descricao, imagem_url AS "imagemUrl", preco_venda AS "precoVenda",
      em_breve AS "emBreve", eh_kit AS "ehKit"
    FROM produtos
    WHERE ativo = true
    ORDER BY
      CASE
        WHEN nome ILIKE 'Sabonete Artesanal%' THEN 0
        WHEN nome ILIKE 'Sabonete Líquido%' THEN 1
        ELSE 2
      END,
      nome ASC
  `;

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
