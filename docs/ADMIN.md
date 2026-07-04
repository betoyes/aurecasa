# Guia do Admin — Auré Casa

## Acesso

- URL: `/admin/login`
- Credenciais definidas no `.env` do backend (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- Sessão: token JWT válido por 7 dias, salvo no navegador. "Sair" encerra a sessão. Token inválido/expirado redireciona automaticamente para o login.

## Abas

### Dashboard
Métricas de pedidos, receita e inscritos, com gráfico de vendas.

### Pedidos
- Lista todos os pedidos (mais recentes primeiro) com número, cliente, total e status.
- **Mudar status**: selecione o novo status no pedido (ex: Pago, Enviado, Entregue).
- **Código de rastreio**: preencha o campo de tracking e salve.
- Se `RESEND_API_KEY` estiver configurada, o cliente recebe e-mail automático a cada mudança de status (com o rastreio, se houver). Sem a chave, a mudança funciona normalmente, apenas sem e-mail.

### Produtos
- **Novo produto**: botão "Novo produto". Campos: nome, slug (gerado automaticamente se vazio), preço, preço promocional, categoria, dimensões, estoque, prazo, descrições, materiais/cuidados, cores, produtos relacionados e flags (Novidade, Destaque, Mais vendido, Indisponível).
- **Imagens**:
  - *Enviar arquivo*: upload de JPG, PNG ou WebP (salvo no servidor).
  - *Cole URL da imagem*: adiciona imagem externa por URL.
  - **A primeira imagem é a principal** (marcada com estrela terracota) — é a capa no catálogo.
  - Botão ★ promove uma imagem a principal; ↑/↓ reordenam; lixeira remove.
  - A "Prévia" mostra como o card ficará na loja.
- **Editar/Excluir**: links em cada linha da lista. O slug não muda ao editar (links existentes continuam válidos).

### Newsletter e Contatos
Listas read-only das inscrições e mensagens recebidas.

### Configurações
Informações do ambiente (provedor de pagamento, e-mail remetente).

## Dicas

- Uploads ficam em `backend/static/uploads/`. Em produção, prefira um volume persistente ou URLs externas (ver DEPLOY.md).
- Cupons demo ativos: `BEMVINDO10` (10%) e `FRETEGRATIS` (compras ≥ R$200). Hoje são fixos no código (`DEMO_COUPONS` em `server.py`).
