# Arquitetura — Auré Casa

## Visão geral

SPA React consumindo uma API FastAPI (arquivo único `backend/server.py`) com MongoDB. Todas as rotas da API têm prefixo `/api` (regra do ingress). O frontend usa exclusivamente `REACT_APP_BACKEND_URL`; o backend usa `MONGO_URL`/`DB_NAME`.

```
React (3000) ──▶ /api/* ──▶ FastAPI (8001) ──▶ MongoDB
                                  └──▶ Resend (e-mails, opcional)
```

## Backend (`backend/server.py`)

### Coleções MongoDB
- `products` — seed de 8 produtos na inicialização (idempotente, só se vazio). IDs são strings/UUIDs, nunca ObjectId exposto.
- `orders` — pedidos com `order_number` legível (ex: `AC2607...`), status e `tracking_code`.
- `newsletter`, `contacts` — inscrições e mensagens.

### Endpoints públicos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/products` | Lista com filtros: `category`, `color`, `min_price`, `max_price`, `sort`, `search`, `available` |
| GET | `/api/products/{slug}` | Detalhe (404 se não existe) |
| GET | `/api/categories` | Categorias com contagem |
| POST | `/api/orders` | Cria pedido (checkout demo) |
| GET | `/api/orders/{id}` | Busca por `id` ou `order_number` |
| POST | `/api/coupons/validate` | Cupons demo: `BEMVINDO10`, `FRETEGRATIS` (mín. R$200) |
| POST | `/api/shipping/cep` | Endereço/frete mock por prefixo do CEP |
| POST | `/api/newsletter` | Inscrição (Resend opcional) |
| POST | `/api/contact` | Mensagem (Resend opcional) |

### Endpoints admin (Bearer JWT)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/admin/login` | Valida `ADMIN_EMAIL`/`ADMIN_PASSWORD`, retorna JWT (7 dias) |
| GET | `/api/admin/verify` | Valida token |
| GET | `/api/admin/stats` | Métricas do dashboard |
| GET | `/api/admin/orders` | Lista pedidos |
| PATCH | `/api/orders/{id}` | Apenas `status` e `tracking_code`; dispara e-mail se Resend configurado |
| GET/POST | `/api/admin/products` | Lista / cria produto |
| PATCH/DELETE | `/api/admin/products/{id}` | Edita / remove |
| POST | `/api/admin/upload` | Upload multipart (jpg/png/webp) → `/api/static/uploads/<arquivo>` |
| GET | `/api/admin/newsletter` · `/api/admin/contacts` | Listas read-only |

### Autenticação admin
- JWT HS256 assinado com `JWT_SECRET`, payload `{email, exp}` (7 dias).
- Sessão do navegador via **cookie httpOnly** `aure_admin_session` (Secure, SameSite=lax, Path=/api) — inacessível a JavaScript, mitigando roubo por XSS. `POST /api/admin/logout` limpa o cookie.
- `require_admin` (dependency) aceita o cookie OU header `Authorization: Bearer <token>` (para clientes de API/testes). Erros: 401 (ausente/expirado/inválido), 403 (e-mail diferente).

### Uploads
- Salvos em `backend/static/uploads/` com nome `uuid4().hex + ext`.
- Servidos por `StaticFiles` montado em `/api/static`.
- Atenção em deploy: disco efêmero perde uploads (ver DEPLOY.md).

## Frontend (`frontend/src`)

### Rotas principais
| Rota | Página |
|---|---|
| `/` | Home editorial |
| `/colecoes`, `/novidades`, `/categoria/:slug`, `/busca` | Collection (grid + filtros) |
| `/produto/:slug` | ProductDetail |
| `/carrinho`, `/checkout`, `/pedido/:orderId` | Cart, Checkout (4 etapas), Confirmation |
| `/favoritos`, `/conta` | Wishlist, Account (mock) |
| `/admin`, `/admin/login` | Painel admin (JWT) |
| `/sobre`, `/contato`, `/privacidade`, etc. | Institucionais |

### Estado do cliente
- **Carrinho e wishlist**: localStorage (hooks em `src/hooks`).
- **Sessão admin**: cookie httpOnly `aure_admin_session` gerenciado pelo backend (nenhum token acessível a JS); `/admin` chama `/api/admin/verify` no mount e redireciona para `/admin/login` se inválido; logout via `POST /api/admin/logout`.
- **Conta do cliente**: mock localStorage, sem backend.

### Design
Tokens em `App.css`/`index.css`: fundo ivory `#F9F8F6`, paleta areia/verde-sálvia/terracota, tipografia Cormorant Garamond (serif) + Outfit (sans). Não alterar sem aprovação — visual já validado.
