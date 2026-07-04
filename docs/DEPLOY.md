# Deploy — Auré Casa

## Variáveis de ambiente

### Backend (`backend/.env` — ver `.env.example`)
| Variável | Obrigatória | Descrição |
|---|---|---|
| `MONGO_URL` | ✅ (default `mongodb://localhost:27017`) | String de conexão MongoDB |
| `DB_NAME` | ✅ (default `aurecasa`) | Nome do banco |
| `CORS_ORIGINS` | ✅ (default `http://localhost:3000`) | Origens permitidas, separadas por vírgula — **nunca `*`** (a sessão admin usa cookie com credenciais) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | Credenciais do painel admin (login retorna 503 se senha vazia) |
| `JWT_SECRET` | ✅ em produção | Segredo do JWT (`openssl rand -hex 32`). Sem ele, um segredo efêmero é gerado por processo e as sessões admin caem a cada restart |
| `BACKEND_PUBLIC_URL` | ✅ em produção | URL pública do backend — usada nas URLs de uploads locais (default `http://localhost:8001`) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` | opcional | Com as 5 definidas, uploads de imagem vão para o Cloudflare R2 (persistente); sem elas, disco local |
| `RESEND_API_KEY` | opcional | Sem ela, e-mails são pulados sem erro |
| `EMAIL_FROM` | opcional | Remetente (domínio verificado no Resend) |
| `EMAIL_OWNER` | opcional | Recebe cópia dos contatos |
| `PAYMENT_PROVIDER` | opcional | `mock` (padrão). Estrutura pronta p/ gateway real |
| `MERCADO_PAGO_ACCESS_TOKEN` / `PAGARME_API_KEY` / `WEBHOOK_SECRET` | opcional | Reservadas p/ integração futura de pagamento |

### Frontend (`frontend/.env` — ver `.env.example`)
| Variável | Descrição |
|---|---|
| `REACT_APP_BACKEND_URL` | URL pública do backend (sem `/api` no final) |

**Nunca hardcode URLs/portas no código.** Configure tudo via `.env` (ver `.env.example` em cada pasta).

## Checklist de produção

1. `JWT_SECRET` forte e único (ex: `openssl rand -hex 32`).
2. `ADMIN_PASSWORD` forte; considere trocar a senha padrão de desenvolvimento.
3. `CORS_ORIGINS` restrito ao domínio real (evite `*`).
4. `RESEND_API_KEY` com domínio verificado + `EMAIL_FROM` próprio, se quiser e-mails reais.
5. **Uploads**: sem R2 configurado, `backend/static/uploads/` é disco local — em plataformas com disco efêmero (Railway, Render etc.) os arquivos somem a cada deploy. Configure as variáveis `R2_*` para persistência.
6. Pagamentos estão em **modo demo** — não anuncie checkout real antes de integrar Mercado Pago/Pagar.me.

## Topologia

- Backend FastAPI em `0.0.0.0:8001`; frontend (build estático ou dev server) em `3000`.
- Em produção, coloque um reverse proxy (Nginx/Caddy) roteando `/api/*` → 8001 e o restante → frontend. Por isso todo endpoint mantém o prefixo `/api`.
- **Rate limiting do login**: o limitador usa o IP do cliente e é em memória, por processo. Atrás de proxy reverso, rode o uvicorn com `--proxy-headers --forwarded-allow-ips <ip-do-proxy>` — sem isso todos os requests parecem vir do IP do proxy e 5 senhas erradas de qualquer pessoa bloqueiam o login do admin por 15 min. Com múltiplos workers o limite efetivo é `5 × workers`; use `--workers 1` ou migre para um store compartilhado (Redis) se a superfície de auth crescer.
- O seed do banco roda automaticamente na primeira subida do backend.
- Exemplo de execução em produção: `uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2` atrás do proxy, e `yarn build` servido como estático.

## Passo a passo: Railway (backend + MongoDB)

1. Em [railway.app](https://railway.app), crie um projeto e adicione o serviço **MongoDB** (template oficial). Copie a `MONGO_URL` gerada (aba *Variables* do serviço Mongo → `MONGO_URL` ou `MONGO_PUBLIC_URL`).
2. Adicione um serviço **GitHub Repo** apontando para `betoyes/aurecasa` e defina **Root Directory = `backend`**. O `Procfile` e o `.python-version` já configuram o start (`uvicorn` com `--proxy-headers`, exigido pelo rate limiter atrás do proxy do Railway).
3. Configure as variáveis do serviço backend:
   - `MONGO_URL` → referência à variável do serviço Mongo (`${{MongoDB.MONGO_URL}}`)
   - `DB_NAME=aurecasa`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (forte), `JWT_SECRET` (`openssl rand -hex 32`)
   - `CORS_ORIGINS=https://SEU-SITE.pages.dev` (o domínio do frontend no Cloudflare Pages)
   - `BACKEND_PUBLIC_URL=https://SEU-BACKEND.up.railway.app`
   - variáveis `R2_*` (ver seção R2 abaixo)
4. Em *Settings → Networking*, gere o domínio público do backend e use-o no passo do frontend.

## Passo a passo: Cloudflare Pages (frontend)

1. Em *Cloudflare Dashboard → Workers & Pages → Create → Pages*, conecte o repo `betoyes/aurecasa`.
2. Configuração de build:
   - **Root directory**: `frontend`
   - **Build command**: `yarn build`
   - **Build output directory**: `build`
3. Variável de ambiente de build: `REACT_APP_BACKEND_URL=https://SEU-BACKEND.up.railway.app` (sem barra final).
4. O arquivo `frontend/public/_redirects` já garante o roteamento SPA (React Router) no Pages.
5. Depois do primeiro deploy, volte ao Railway e ajuste `CORS_ORIGINS` com o domínio final do Pages (ou o domínio próprio, se configurar um).

## Passo a passo: Cloudflare R2 (imagens de produtos)

1. Em *Cloudflare Dashboard → R2*, crie um bucket (ex.: `aurecasa-uploads`).
2. No bucket, ative acesso público (*Settings → Public access → R2.dev subdomain* ou domínio próprio) e copie a URL pública.
3. Em *R2 → Manage R2 API Tokens*, crie um token **Object Read & Write** limitado ao bucket.
4. Preencha no backend (Railway e/ou `.env` local):
   - `R2_ACCOUNT_ID` (ID da conta Cloudflare, visível na URL do dashboard)
   - `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` (do token criado)
   - `R2_BUCKET=aurecasa-uploads`
   - `R2_PUBLIC_URL=https://pub-XXXX.r2.dev` (a URL pública do passo 2)
5. Com as 5 variáveis presentes, os uploads do admin passam a ir para o R2 automaticamente (chave `uploads/<arquivo>`); sem elas, caem no disco local.
