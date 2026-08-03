# Checklist de testes — Saboraria / Lud'E

Roteiro manual de QA de ponta a ponta. Use antes de qualquer deploy
importante ou depois de mudanças em áreas críticas (custo médio, checkout,
autenticação).

## Painel admin (`/admin`)

- [ ] Login com senha errada → mensagem de erro, não entra
- [ ] Login com credenciais certas → entra no dashboard
- [ ] Acessar qualquer rota `/admin/*` deslogado → redireciona pro login
- [ ] **Insumos**: criar, editar, remover; remover um insumo em uso (com
      compra ou receita vinculada) → `409`, não remove
- [ ] **Compra de insumo**: registrar compra → `custo_unitario_atual`
      atualiza como média ponderada de *todas* as compras (não só a
      última)
- [ ] **Produtos**: criar, editar, remover; remover um produto com pedido
      vinculado → `409`, não remove
- [ ] **Receita do produto**: adicionar/remover insumo, salvar → `custo_medio`
      recalcula; registrar uma nova compra de um insumo usado na receita →
      `custo_medio` do produto atualiza sozinho, sem precisar editar a
      receita de novo
- [ ] **Despesas**: criar, editar, remover, filtrar por período
- [ ] **Vendas manuais**: registrar venda com múltiplos produtos → total
      bate, aparece no histórico
- [ ] **Dashboard**: total de vendas/despesas/lucro do período bate com os
      dados criados
- [ ] Logout → sessão realmente encerrada (acessar rota protegida de novo
      pede login)

## Site público (`/`)

- [ ] Home carrega sem nenhuma chamada a `/api/admin/me` no console
- [ ] Catálogo mostra só produtos com `ativo: true`, com foto (quando
      `imagemUrl` existe) ou placeholder ilustrado (quando não existe)
- [ ] Página de produto individual carrega com preço e descrição corretos
- [ ] Carrinho: adicionar, alterar quantidade, remover, **persiste depois
      de recarregar a página** (localStorage)
- [ ] Checkout: campos obrigatórios bloqueiam o envio se vazios; ao
      submeter com dados válidos, redireciona pro Checkout Pro do Mercado
      Pago
- [ ] Página de retorno (`/checkout/retorno`): sem `payment_id` na URL
      mostra estado "pendente" genérico (não expõe status de pedido por id
      sequencial — ver nota de segurança abaixo)
- [ ] Acesso direto por URL a `/catalogo` (sem passar pela Home) funciona
- [ ] Testar em viewport mobile (largura ~390px): Home, Catálogo e
      Produto legíveis e usáveis

## Segurança (revisão feita na Fase 9)

- Toda rota `/api/admin/*` (exceto `/login`) exige `authMiddleware` —
  conferido rota por rota
- Catálogo público (`/api/produtos`) usa `select` (allowlist) — nunca
  retorna `custoMedio` ou a receita interna
- Webhook do Mercado Pago valida `x-signature` **e** sempre busca o
  pagamento de verdade na API do MP antes de confiar em qualquer status
  (nunca confia no payload recebido)
- Cookie de sessão usa `SameSite=None; Secure` em produção (frontend e
  backend em domínios diferentes) e `SameSite=Lax` em desenvolvimento
- Login tem rate limit (10 tentativas / 15 min por IP) contra força bruta
- **Removido**: endpoint público `GET /api/checkout/:id/status` permitia
  consultar o status de qualquer pedido só trocando o id sequencial na
  URL (IDOR de baixo impacto — só `{id, status}`, sem PII, mas era uma
  falha de autorização real). A confirmação de pagamento na página de
  retorno agora depende só do `payment_id` (não sequencial, vindo do
  Mercado Pago), não mais de consultar por id de pedido
- `npm audit`: backend limpo. Frontend acusa uma vulnerabilidade alta em
  `react-router`, mas é específica de "RSC Mode" (React Server
  Components/Server Actions) — recurso que este projeto não usa (SPA
  client-side puro com Vite). Vale revisar numa atualização futura do
  pacote, sem urgência dado que não se aplica ao nosso uso
- `robots.txt` bloqueia indexação de `/admin` (higiene, não é proteção de
  segurança de verdade)

## Limitações conhecidas (aceitas, não bugs)

- Pagamento aprovado de ponta a ponta não é testável sem uma segunda
  conta de comprador de teste no Mercado Pago (a conta que temos é a
  vendedora) — o fluxo até o redirecionamento pro checkout é validado,
  mas a confirmação com pagamento real precisa ser testada manualmente
  quando houver essa segunda conta, ou em produção com clientes reais
- Sem rate limit nas rotas públicas de checkout/catálogo — baixo risco
  dado o volume esperado (negócio pequeno, admin único), mas vale
  reconsiderar se o tráfego crescer
