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

  const maisVendidos = await prisma.$queryRaw`
    SELECT ip.produto_id AS "produtoId", SUM(ip.quantidade) AS total
    FROM itens_pedido ip
    JOIN pedidos p ON p.id = ip.pedido_id
    WHERE p.status = 'pago'
    GROUP BY ip.produto_id
    ORDER BY total DESC
    LIMIT 3
  `;
  const idsMaisVendidos = new Set(maisVendidos.map((m) => m.produtoId));

  return res.json(produtos.map((p) => ({ ...p, maisVendido: idsMaisVendidos.has(p.id) })));
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

  const maisVendidos = await prisma.$queryRaw`
    SELECT ip.produto_id AS "produtoId", SUM(ip.quantidade) AS total
    FROM itens_pedido ip
    JOIN pedidos p ON p.id = ip.pedido_id
    WHERE p.status = 'pago'
    GROUP BY ip.produto_id
    ORDER BY total DESC
    LIMIT 3
  `;
  const maisVendido = maisVendidos.some((m) => m.produtoId === produto.id);

  return res.json({ ...produto, maisVendido });
}

module.exports = { listar, detalhe };
