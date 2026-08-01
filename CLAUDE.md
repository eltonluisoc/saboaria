# Projeto: Saboraria (sistema de gestão + loja online)

## Contexto
Sistema completo para uma saboraria (produção artesanal de sabonetes): gestão de
insumos, produtos, despesas, vendas, e uma loja online com pagamento real.
Uso pessoal do dono (admin único) + clientes comprando pelo site.

## Stack definida (não trocar sem confirmar com o usuário)
- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: PostgreSQL hospedado no Neon
- Pagamento: Mercado Pago (Pix + cartão)
- Deploy: Vercel (frontend) + Render ou Railway (backend)
- Estrutura: monorepo — `/frontend` e `/backend` na raiz

## Regras de segurança (inegociáveis)
- Senha do admin: hash bcrypt no banco. NUNCA em texto puro no código.
- Segredos (string de conexão do banco, chave JWT, credenciais Mercado Pago)
  ficam em variáveis de ambiente (`.env`), que deve estar no `.gitignore`.
- Login admin gera token JWT guardado em cookie `httpOnly`.

## Regra de negócio central: custo médio
- Cada insumo tem um `custo_unitario_atual`, recalculado como MÉDIA PONDERADA
  de todas as compras já registradas daquele insumo (não usar só a última compra).
- Cada produto tem uma "receita" (tabela `produto_insumo`) ligando insumos e
  quantidades usadas.
- O `custo_medio` do produto = soma de (quantidade_usada × custo_unitario_atual)
  de cada insumo da receita. Deve recalcular sempre que um insumo ou receita mudar.

## Modelo de dados (tabelas principais)
admin_usuarios, insumos, compras_insumo, produtos, produto_insumo,
despesas_gerais, clientes, pedidos, itens_pedido

## Fases do projeto (seguir nesta ordem, uma de cada vez)
1. Modelagem e criação do banco (Neon + migrations)
2. Backend base: conexão com banco + autenticação admin
3. Módulo Insumos + Produtos (com cálculo de custo médio)
4. Módulo Despesas + Vendas manuais
5. Painel Admin (frontend conectado à API)
6. Site público (catálogo + carrinho)
7. Integração Mercado Pago
8. Deploy (Render/Railway + Vercel + Neon)
9. Testes finais

## Como trabalhar comigo (instruções para o Claude Code)
- Sempre usar Plan Mode / mostrar o plano antes de mexer em múltiplos arquivos.
- Trabalhar uma fase por vez. Não pular fases nem antecipar funcionalidades
  de fases futuras sem perguntar.
- Nunca commitar `.env` ou qualquer segredo.
- Explicar decisões técnicas em português, de forma direta.
