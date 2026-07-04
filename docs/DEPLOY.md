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
5. **Uploads**: `backend/static/uploads/` é disco local. Em plataformas com disco efêmero os arquivos somem em cada deploy — use volume persistente ou armazene imagens por URL externa (S3/Cloudinary) até haver storage dedicado.
6. Pagamentos estão em **modo demo** — não anuncie checkout real antes de integrar Mercado Pago/Pagar.me.

## Topologia

- Backend FastAPI em `0.0.0.0:8001`; frontend (build estático ou dev server) em `3000`.
- Em produção, coloque um reverse proxy (Nginx/Caddy) roteando `/api/*` → 8001 e o restante → frontend. Por isso todo endpoint mantém o prefixo `/api`.
- O seed do banco roda automaticamente na primeira subida do backend.
- Exemplo de execução em produção: `uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2` atrás do proxy, e `yarn build` servido como estático.
