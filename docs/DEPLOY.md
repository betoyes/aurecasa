# Deploy — Auré Casa

## Variáveis de ambiente

### Backend (`backend/.env` — ver `.env.example`)
| Variável | Obrigatória | Descrição |
|---|---|---|
| `MONGO_URL` | ✅ | String de conexão MongoDB |
| `DB_NAME` | ✅ | Nome do banco |
| `CORS_ORIGINS` | ✅ | Origens permitidas (`*` ou lista separada por vírgula) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | Credenciais do painel admin (login retorna 503 se senha vazia) |
| `JWT_SECRET` | ✅ | Segredo do JWT — **troque em produção** |
| `RESEND_API_KEY` | opcional | Sem ela, e-mails são pulados sem erro |
| `EMAIL_FROM` | opcional | Remetente (domínio verificado no Resend) |
| `EMAIL_OWNER` | opcional | Recebe cópia dos contatos |
| `PAYMENT_PROVIDER` | opcional | `mock` (padrão). Estrutura pronta p/ gateway real |
| `MERCADO_PAGO_ACCESS_TOKEN` / `PAGARME_API_KEY` / `WEBHOOK_SECRET` | opcional | Reservadas p/ integração futura de pagamento |

### Frontend (`frontend/.env` — ver `.env.example`)
| Variável | Descrição |
|---|---|
| `REACT_APP_BACKEND_URL` | URL pública do backend (sem `/api` no final) |

**Nunca hardcode URLs/portas no código.** No ambiente Emergent, `REACT_APP_BACKEND_URL` e `MONGO_URL` já vêm configurados — não os altere.

## Checklist de produção

1. `JWT_SECRET` forte e único (ex: `openssl rand -hex 32`).
2. `ADMIN_PASSWORD` forte; considere trocar a senha padrão de desenvolvimento.
3. `CORS_ORIGINS` restrito ao domínio real (evite `*`).
4. `RESEND_API_KEY` com domínio verificado + `EMAIL_FROM` próprio, se quiser e-mails reais.
5. **Uploads**: `backend/static/uploads/` é disco local. Em plataformas com disco efêmero os arquivos somem em cada deploy — use volume persistente ou armazene imagens por URL externa (S3/Cloudinary) até haver storage dedicado.
6. Pagamentos estão em **modo demo** — não anuncie checkout real antes de integrar Mercado Pago/Pagar.me.

## Ambiente Emergent (atual)

- Supervisor gerencia os processos: backend em `0.0.0.0:8001`, frontend em `3000`.
- `sudo supervisorctl restart backend|frontend|all`
- Logs: `/var/log/supervisor/backend.err.log` e `frontend.err.log`.
- Ingress roteia `/api/*` → 8001 e o restante → 3000. Por isso todo endpoint deve manter o prefixo `/api`.
- Deploy nativo: use o recurso *Deploy* da plataforma Emergent (o seed do banco roda automaticamente na primeira subida).
