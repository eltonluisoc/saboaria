const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const { payment: paymentClient } = require("../config/mercadopago");

// Baixa o estoque de um item vendido. Se o produto e um kit, baixa cada
// componente da composicao (quantidade do componente x quantidade vendida
// do kit) em vez do estoqueAtual do proprio kit (que fica sem uso - nunca e
// incrementado por lote de producao, so produto simples e produzido).
async function baixarEstoqueItem(tx, produtoId, quantidade) {
  const produto = await tx.produto.findUnique({
    where: { id: produtoId },
    select: { ehKit: true, composicaoKit: { select: { produtoId: true, quantidade: true } } },
  });

  if (produto?.ehKit) {
    for (const componente of produto.composicaoKit) {
      await tx.produto.update({
        where: { id: componente.produtoId },
        data: { estoqueAtual: { decrement: componente.quantidade * quantidade } },
      });
    }
    return;
  }

  await tx.produto.update({
    where: { id: produtoId },
    data: { estoqueAtual: { decrement: quantidade } },
  });
}

async function criarPedidoComItens(
  tx,
  {
    clienteId,
    origem,
    status,
    formaPagamento,
    itens,
    produtosPorId,
    valorFrete = 0,
    formaEntrega = null,
    nomeComprador = null,
  }
) {
  let valorItens = new Prisma.Decimal(0);
  const itensData = itens.map((item) => {
    const produto = produtosPorId.get(Number(item.produtoId));
    const quantidade = Number(item.quantidade);
    const subtotal = produto.precoVenda.times(quantidade);
    valorItens = valorItens.plus(subtotal);

    return {
      produtoId: produto.id,
      quantidade,
      precoUnitario: produto.precoVenda,
      subtotal,
    };
  });

  const valorTotal = valorItens.plus(valorFrete);

  const novoPedido = await tx.pedido.create({
    data: {
      clienteId: clienteId ? Number(clienteId) : null,
      origem,
      status,
      valorTotal,
      valorFrete,
      formaEntrega,
      nomeComprador,
      formaPagamento: formaPagamento || null,
    },
  });

  await tx.itemPedido.createMany({
    data: itensData.map((item) => ({ ...item, pedidoId: novoPedido.id })),
  });

  if (status === "pago") {
    for (const item of itensData) {
      await baixarEstoqueItem(tx, item.produtoId, item.quantidade);
    }
  }

  return tx.pedido.findUnique({
    where: { id: novoPedido.id },
    include: { itens: { include: { produto: true } }, cliente: true },
  });
}

const STATUS_MAP = {
  approved: "pago",
  rejected: "cancelado",
  cancelled: "cancelado",
  refunded: "cancelado",
  charged_back: "cancelado",
};

// Unica fonte de verdade sobre "esse pagamento foi aprovado?": sempre busca
// na API do Mercado Pago com nosso Access Token, nunca confia em status
// vindo de fora (nem do webhook, nem de um payment_id passado pelo cliente).
async function confirmarPagamento(paymentId) {
  const pagamento = await paymentClient().get({ id: paymentId });

  const pedidoId = Number(pagamento.external_reference);
  if (!Number.isInteger(pedidoId)) {
    console.warn(`Pagamento ${paymentId} sem external_reference valido`);
    return null;
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { itens: true },
  });
  if (!pedido) {
    console.warn(`Pagamento ${paymentId} referencia pedido ${pedidoId} inexistente`);
    return null;
  }

  const valorPago = Number(pagamento.transaction_amount);
  const valorEsperado = Number(pedido.valorTotal);
  if (Math.abs(valorPago - valorEsperado) > 0.01) {
    console.warn(
      `Pagamento ${paymentId} com valor divergente do pedido ${pedidoId}: pago=${valorPago} esperado=${valorEsperado}`
    );
    return pedido;
  }

  const novoStatus = STATUS_MAP[pagamento.status] || pedido.status;
  const precisaDecrementarEstoque = pedido.status !== "pago" && novoStatus === "pago";

  return prisma.$transaction(async (tx) => {
    if (precisaDecrementarEstoque) {
      for (const item of pedido.itens) {
        await baixarEstoqueItem(tx, item.produtoId, item.quantidade);
      }
    }

    return tx.pedido.update({
      where: { id: pedidoId },
      data: {
        status: novoStatus,
        mpPaymentId: String(pagamento.id),
        formaPagamento: pagamento.payment_method_id || pedido.formaPagamento,
      },
    });
  });
}

module.exports = { criarPedidoComItens, confirmarPagamento };
