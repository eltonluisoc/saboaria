const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const { payment: paymentClient } = require("../config/mercadopago");

async function criarPedidoComItens(
  tx,
  { clienteId, origem, status, formaPagamento, itens, produtosPorId, valorFrete = 0 }
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
      formaPagamento: formaPagamento || null,
    },
  });

  await tx.itemPedido.createMany({
    data: itensData.map((item) => ({ ...item, pedidoId: novoPedido.id })),
  });

  if (status === "pago") {
    for (const item of itensData) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { estoqueAtual: { decrement: item.quantidade } },
      });
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
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoqueAtual: { decrement: item.quantidade } },
        });
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
