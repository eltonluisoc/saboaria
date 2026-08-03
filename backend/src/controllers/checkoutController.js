const prisma = require("../config/prisma");
const { preference: preferenceClient } = require("../config/mercadopago");
const { criarPedidoComItens, confirmarPagamento } = require("../services/pedidoService");
const { frontendUrl, backendUrl, nodeEnv } = require("../config/env");

function validarCheckoutBody(body) {
  const { itens, cliente } = body || {};

  if (!Array.isArray(itens) || itens.length === 0) {
    return "Campo 'itens' deve ser uma lista com pelo menos um item";
  }

  const idsVistos = new Set();
  for (const item of itens) {
    const produtoId = Number(item?.produtoId);
    const quantidade = Number(item?.quantidade);

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      return "Cada item precisa de um 'produtoId' valido";
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return "Cada item precisa de 'quantidade' inteira maior que zero";
    }
    if (idsVistos.has(produtoId)) {
      return `Produto ${produtoId} aparece mais de uma vez nos itens`;
    }
    idsVistos.add(produtoId);
  }

  if (!cliente || typeof cliente !== "object") {
    return "Campo 'cliente' e obrigatorio";
  }
  if (typeof cliente.nome !== "string" || !cliente.nome.trim()) {
    return "Nome do cliente e obrigatorio";
  }
  if (typeof cliente.email !== "string" || !cliente.email.trim()) {
    return "Email do cliente e obrigatorio";
  }
  if (typeof cliente.endereco !== "string" || !cliente.endereco.trim()) {
    return "Endereco de entrega e obrigatorio";
  }
  if (cliente.telefone !== undefined && cliente.telefone !== null && typeof cliente.telefone !== "string") {
    return "Telefone deve ser texto";
  }

  return null;
}

async function criar(req, res) {
  const erro = validarCheckoutBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { itens, cliente: dadosCliente } = req.body;

  const produtoIds = itens.map((item) => Number(item.produtoId));
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, ativo: true },
  });
  const produtosPorId = new Map(produtos.map((p) => [p.id, p]));

  const idsFaltantes = produtoIds.filter((id) => !produtosPorId.has(id));
  if (idsFaltantes.length > 0) {
    return res.status(400).json({
      error: `Produto(s) indisponivel(is): ${idsFaltantes.join(", ")}`,
    });
  }

  const email = dadosCliente.email.trim().toLowerCase();
  const cliente = await prisma.cliente.upsert({
    where: { email },
    update: {
      nome: dadosCliente.nome.trim(),
      telefone: dadosCliente.telefone ? dadosCliente.telefone.trim() : null,
      endereco: dadosCliente.endereco.trim(),
    },
    create: {
      nome: dadosCliente.nome.trim(),
      email,
      telefone: dadosCliente.telefone ? dadosCliente.telefone.trim() : null,
      endereco: dadosCliente.endereco.trim(),
    },
  });

  const pedido = await prisma.$transaction((tx) =>
    criarPedidoComItens(tx, {
      clienteId: cliente.id,
      origem: "site",
      status: "pendente",
      formaPagamento: null,
      itens,
      produtosPorId,
    })
  );

  // auto_return exige que back_urls.success seja uma URL publica de verdade -
  // localhost nao serve pra essa validacao especifica do Mercado Pago (ainda
  // funciona como back_url normal, so nao entra o redirect automatico).
  const ehLocalhost = frontendUrl.startsWith("http://localhost");

  const preferencia = await preferenceClient().create({
    body: {
      items: pedido.itens.map((item) => ({
        title: item.produto.nome,
        quantity: item.quantidade,
        unit_price: Number(item.precoUnitario),
        currency_id: "BRL",
      })),
      payer: {
        name: cliente.nome,
        email: cliente.email,
      },
      external_reference: String(pedido.id),
      back_urls: {
        success: `${frontendUrl}/checkout/retorno`,
        pending: `${frontendUrl}/checkout/retorno`,
        failure: `${frontendUrl}/checkout/retorno`,
      },
      ...(ehLocalhost ? {} : { auto_return: "approved" }),
      notification_url: `${backendUrl}/api/webhooks/mercadopago`,
    },
  });

  await prisma.pedido.update({
    where: { id: pedido.id },
    data: { mpPreferenceId: preferencia.id },
  });

  // O Mercado Pago sempre retorna os dois links, independente da credencial
  // usada - quem decide qual usar e o ambiente: em producao tem que ir pro
  // checkout real, sandbox e so pra teste local com credenciais de teste.
  const checkoutUrl = nodeEnv === "production" ? preferencia.init_point : preferencia.sandbox_init_point || preferencia.init_point;

  return res.status(201).json({
    pedidoId: pedido.id,
    checkoutUrl,
  });
}

async function confirmar(req, res) {
  const { paymentId } = req.body || {};
  if (!paymentId) {
    return res.status(400).json({ error: "Campo 'paymentId' e obrigatorio" });
  }

  try {
    const pedido = await confirmarPagamento(paymentId);
    if (!pedido) {
      return res.status(404).json({ error: "Pagamento ou pedido nao encontrado" });
    }
    return res.json({ pedidoId: pedido.id, status: pedido.status });
  } catch (err) {
    console.error("Erro ao confirmar pagamento:", err.message);
    return res.status(502).json({ error: "Erro ao consultar pagamento no Mercado Pago" });
  }
}

module.exports = { criar, confirmar };
