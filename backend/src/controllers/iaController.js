const prisma = require("../config/prisma");
const { xaiApiKey, xaiModel, geminiApiKey, geminiModel } = require("../config/env");

const FORMAS_PAGAMENTO_VALIDAS = ["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito"];

function montarPrompt(texto, produtos) {
  const listaProdutos = produtos
    .map((p) => `${p.id} — ${p.nome} — R$ ${Number(p.precoVenda).toFixed(2)}`)
    .join("\n");

  return `Você ajuda a interpretar uma venda descrita em português informal e devolve APENAS um JSON válido, sem nenhum texto antes ou depois.

Produtos cadastrados (use o "id" exato da lista, nunca invente um id que não esteja aqui):
${listaProdutos}

Formas de pagamento aceitas (use exatamente um destes textos, ou null se o texto não mencionar): ${FORMAS_PAGAMENTO_VALIDAS.join(", ")}.

Devolva exatamente este formato JSON:
{
  "itens": [{"produtoId": <id inteiro de um produto da lista>, "quantidade": <inteiro maior que zero>}],
  "nomeComprador": "<nome do cliente mencionado, ou null>",
  "formaPagamento": "<uma das formas aceitas, ou null>",
  "status": "pago" se o texto disser que o pagamento já foi feito/recebido, "pendente" se disser que falta pagar ou não tiver certeza,
  "observacao": "<aviso curto em português se algum produto citado não bateu claramente com a lista, ou null>"
}

Texto da venda: "${texto}"`;
}

// Provedor principal (camada gratuita, sem cartao) - Google AI Studio.
async function chamarGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
  const resposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error("Erro na API do Gemini:", resposta.status, corpo);
    throw new Error("erro_api_ia");
  }

  const dados = await resposta.json();
  return dados?.candidates?.[0]?.content?.parts?.[0]?.text;
}

// Provedor alternativo (xAI/Grok) - mantido pronto caso o credito da conta
// seja resolvido depois; so entra em uso se GEMINI_API_KEY nao estiver
// configurada.
async function chamarGrok(prompt) {
  const resposta = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${xaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: xaiModel,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error("Erro na API da Grok:", resposta.status, corpo);
    throw new Error("erro_api_ia");
  }

  const dados = await resposta.json();
  return dados?.choices?.[0]?.message?.content;
}

async function interpretarVenda(req, res) {
  const { texto } = req.body || {};
  if (typeof texto !== "string" || !texto.trim()) {
    return res.status(400).json({ error: "Campo 'texto' e obrigatorio" });
  }
  if (!geminiApiKey && !xaiApiKey) {
    return res.status(400).json({
      error: "GEMINI_API_KEY (ou XAI_API_KEY) nao configurada no .env - necessario para interpretar vendas por IA",
    });
  }

  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, precoVenda: true },
  });

  const prompt = montarPrompt(texto.trim(), produtos);
  let conteudo;
  try {
    conteudo = geminiApiKey ? await chamarGemini(prompt) : await chamarGrok(prompt);
  } catch (err) {
    if (err.message === "erro_api_ia") {
      return res.status(502).json({ error: "Erro ao chamar a IA - tente novamente ou preencha manualmente" });
    }
    console.error("Falha de rede ao chamar a API de IA:", err);
    return res.status(502).json({ error: "Nao foi possivel contatar a IA agora - preencha manualmente" });
  }

  let interpretado;
  try {
    interpretado = JSON.parse(conteudo);
  } catch {
    return res.status(502).json({ error: "A IA nao devolveu um JSON valido - preencha manualmente" });
  }

  const produtosPorId = new Map(produtos.map((p) => [p.id, p]));
  const avisos = [];
  const itensValidos = [];

  for (const item of Array.isArray(interpretado.itens) ? interpretado.itens : []) {
    const produtoId = Number(item?.produtoId);
    const quantidade = Number(item?.quantidade);
    const produto = produtosPorId.get(produtoId);

    if (!produto) {
      avisos.push(`Produto id ${item?.produtoId} nao encontrado - item ignorado, adicione manualmente`);
      continue;
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      avisos.push(`Quantidade invalida pro produto "${produto.nome}" - item ignorado`);
      continue;
    }
    itensValidos.push({ produtoId, quantidade });
  }

  const formaPagamento = FORMAS_PAGAMENTO_VALIDAS.includes(interpretado.formaPagamento)
    ? interpretado.formaPagamento
    : null;
  const status = interpretado.status === "pago" ? "pago" : "pendente";
  const nomeComprador =
    typeof interpretado.nomeComprador === "string" && interpretado.nomeComprador.trim()
      ? interpretado.nomeComprador.trim()
      : null;

  if (interpretado.observacao) {
    avisos.unshift(String(interpretado.observacao));
  }
  if (itensValidos.length === 0) {
    avisos.unshift("Nenhum produto reconhecido - adicione manualmente abaixo");
  }

  return res.json({
    itens: itensValidos,
    nomeComprador,
    formaPagamento,
    status,
    avisos,
  });
}

module.exports = { interpretarVenda };
