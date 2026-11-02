const prisma = require("../config/prisma");

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  descricao: true,
  imagemUrl: true,
  precoVenda: true,
  emBreve: true,
  ehKit: true,
  categoria: true,
};

function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Saboaria e sabonete primeiro, sempre: Sabonetes, depois Casa, Carro,
// Corpo, Kits, nessa ordem, em qualquer lista publica (catalogo e Home
// usam o mesmo endpoint). Ordena pela categoria (campo de verdade) em vez
// de casar o nome - categoria nova cai no fim ate alguem decidir a ordem.
async function listar(req, res) {
  const produtos = await prisma.$queryRaw`
    SELECT id, nome, descricao, imagem_url AS "imagemUrl", preco_venda AS "precoVenda",
      em_breve AS "emBreve", eh_kit AS "ehKit", categoria
    FROM produtos
    WHERE ativo = true
    ORDER BY
      CASE categoria
        WHEN 'Sabonetes' THEN 0
        WHEN 'Casa' THEN 1
        WHEN 'Carro' THEN 2
        WHEN 'Corpo' THEN 3
        WHEN 'Kits' THEN 4
        ELSE 5
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
