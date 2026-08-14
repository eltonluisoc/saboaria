const prisma = require("../config/prisma");

async function detalhe(req, res) {
  const { codigoAcesso } = req.params;

  const pedido = await prisma.pedido.findUnique({
    where: { codigoAcesso },
    include: {
      itens: { include: { produto: { select: { nome: true } } } },
      rastreioEventos: { orderBy: { dataEvento: "desc" } },
    },
  });

  if (!pedido) {
    return res.status(404).json({ error: "Pedido nao encontrado" });
  }

  return res.json({
    id: pedido.id,
    status: pedido.status,
    dataPedido: pedido.dataPedido,
    statusRastreioAtual: pedido.statusRastreioAtual,
    itens: pedido.itens.map((item) => ({
      nome: item.produto.nome,
      quantidade: item.quantidade,
    })),
    eventos: pedido.rastreioEventos.map((evento) => ({
      descricao: evento.descricao,
      local: evento.local,
      dataEvento: evento.dataEvento,
    })),
  });
}

module.exports = { detalhe };
