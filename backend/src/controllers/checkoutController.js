const prisma = require("../config/prisma");
const { preference: preferenceClient } = require("../config/mercadopago");
const { criarPedidoComItens, confirmarPagamento } = require("../services/pedidoService");
const { frontendUrl, backendUrl, nodeEnv, freteFixo } = require("../config/env");

const FORMAS_ENTREGA_VALIDAS = ["envio", "retirada"];
const DESCONTO_CLIENTE_LOGADO = 5;

function normalizarCodigoCupom(codigo) {
  return typeof codigo === "string" ? codigo.trim().toUpperCase() : "";
}

// Unica fonte de verdade sobre se um cupom vale: codigo existe, esta ativo,
// nao passou da validade e nao estourou o uso maximo. Usada tanto pelo
// endpoint de preview (validarCupom) quanto pelo checkout de verdade
// (criar) - nunca confia no desconto que o front calculou.
async function buscarCupomValido(codigo) {
  const codigoNormalizado = normalizarCodigoCupom(codigo);
  if (!codigoNormalizado) return { cupom: null, motivo: null };

  const cupom = await prisma.cupom.findUnique({ where: { codigo: codigoNormalizado } });
  if (!cupom || !cupom.ativo) {
    return { cupom: null, motivo: "Cupom nao encontrado ou inativo" };
  }
  if (cupom.validoAte && cupom.validoAte < new Date()) {
    return { cupom: null, motivo: "Cupom expirado" };
  }
  if (cupom.usoMaximo !== null && cupom.vezesUsado >= cupom.usoMaximo) {
    return { cupom: null, motivo: "Cupom atingiu o limite de uso" };
  }
  return { cupom, motivo: null };
}

async function validarCupom(req, res) {
  const { codigo } = req.body || {};
  const { cupom, motivo } = await buscarCupomValido(codigo);
  if (!cupom) {
    return res.json({ valido: false, motivo: motivo || "Cupom invalido" });
  }
  return res.json({ valido: true, percentualDesconto: Number(cupom.percentualDesconto) });
}

function validarCheckoutBody(body) {
  const { itens, cliente, formaEntrega } = body || {};

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

  if (formaEntrega !== undefined && !FORMAS_ENTREGA_VALIDAS.includes(formaEntrega)) {
    return "Campo 'formaEntrega' deve ser 'envio' ou 'retirada'";
  }

  return null;
}

async function criar(req, res) {
  const erro = validarCheckoutBody(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  const { itens, cliente: dadosCliente, formaEntrega = "envio", cupom: codigoCupom } = req.body;

  const produtoIds = itens.map((item) => Number(item.produtoId));
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, ativo: true, emBreve: false },
  });
  const produtosPorId = new Map(produtos.map((p) => [p.id, p]));

  const idsFaltantes = produtoIds.filter((id) => !produtosPorId.has(id));
  if (idsFaltantes.length > 0) {
    return res.status(400).json({
      error: `Produto(s) indisponivel(is): ${idsFaltantes.join(", ")}`,
    });
  }

  // Cliente logado (cookie opcional, checkoutRoutes.js): atualiza a conta
  // ja existente em vez de upsert por email - nao deixa o checkout trocar
  // o email de login, so os dados de entrega. Sem login, continua o
  // upsert por email de sempre (visitante nunca fica bloqueado).
  const cliente = req.cliente
    ? await prisma.cliente.update({
        where: { id: req.cliente.id },
        data: {
          nome: dadosCliente.nome.trim(),
          telefone: dadosCliente.telefone ? dadosCliente.telefone.trim() : null,
          endereco: dadosCliente.endereco.trim(),
        },
      })
    : await prisma.cliente.upsert({
        where: { email: dadosCliente.email.trim().toLowerCase() },
        update: {
          nome: dadosCliente.nome.trim(),
          telefone: dadosCliente.telefone ? dadosCliente.telefone.trim() : null,
          endereco: dadosCliente.endereco.trim(),
        },
        create: {
          nome: dadosCliente.nome.trim(),
          email: dadosCliente.email.trim().toLowerCase(),
          telefone: dadosCliente.telefone ? dadosCliente.telefone.trim() : null,
          endereco: dadosCliente.endereco.trim(),
        },
      });

  const valorFreteAplicado = formaEntrega === "retirada" ? 0 : freteFixo;

  // Cupom e desconto de cliente logado nao acumulam - aplica o maior dos
  // dois. So registra (e consome) o cupom quando ele de fato decidiu o
  // desconto aplicado; senao o cliente so ganhou o desconto de login mesmo.
  const descontoCliente = req.cliente ? DESCONTO_CLIENTE_LOGADO : 0;
  const { cupom } = codigoCupom ? await buscarCupomValido(codigoCupom) : { cupom: null };
  const descontoCupom = cupom ? Number(cupom.percentualDesconto) : 0;
  const descontoPercentual = Math.max(descontoCliente, descontoCupom);
  const cupomId = cupom && descontoCupom >= descontoCliente ? cupom.id : null;

  const pedido = await prisma.$transaction((tx) =>
    criarPedidoComItens(tx, {
      clienteId: cliente.id,
      cupomId,
      origem: "site",
      status: "pendente",
      formaPagamento: null,
      itens,
      produtosPorId,
      valorFrete: valorFreteAplicado,
      formaEntrega,
      descontoPercentual,
    })
  );

  // auto_return exige que back_urls.success seja uma URL publica de verdade -
  // localhost nao serve pra essa validacao especifica do Mercado Pago (ainda
  // funciona como back_url normal, so nao entra o redirect automatico).
  const ehLocalhost = frontendUrl.startsWith("http://localhost");

  const preferencia = await preferenceClient().create({
    body: {
      // O item "Frete" precisa entrar na preference de verdade, nao so ser
      // somado por tras em valorTotal - o Mercado Pago cobra exatamente a
      // soma dos items, e confirmarPagamento (pedidoService.js) recusa
      // marcar como pago se o valor pago divergir do valorTotal esperado.
      items: [
        ...pedido.itens.map((item) => ({
          title: item.produto.nome,
          quantity: item.quantidade,
          unit_price: Number(item.precoUnitario),
          currency_id: "BRL",
        })),
        ...(Number(pedido.valorFrete) > 0
          ? [
              {
                title: "Frete",
                quantity: 1,
                unit_price: Number(pedido.valorFrete),
                currency_id: "BRL",
              },
            ]
          : []),
      ],
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

function frete(req, res) {
  return res.json({ valorFrete: freteFixo });
}

module.exports = { criar, confirmar, frete, validarCupom };
