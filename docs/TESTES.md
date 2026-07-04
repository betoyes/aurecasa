# Testes — Auré Casa

## Auditoria E2E (julho/2026)

### Backend — 38/38 aprovados (agente de testes, suite em `/app/backend_test.py`)
| Área | Resultado |
|---|---|
| Auth admin (login válido/inválido, verify, token adulterado/ausente) | ✅ 5/5 |
| CRUD produtos + upload (criar, editar, reordenar imagens, deletar, 401 sem token, 400 formato inválido, arquivo servido) | ✅ 8/8 |
| Catálogo público (lista, filtros categoria/cor/preço/sort, slug 404, categorias) | ✅ 5/5 |
| Pedidos (criar, buscar por id/número, PATCH status+tracking, 401/400/404, e-mail opcional sem chave) | ✅ 7/7 |
| Cupons e CEP (BEMVINDO10, FRETEGRATIS c/ mínimo, cupom inexistente, CEPs) | ✅ 6/6 |
| Newsletter e contato (novo, duplicado, 422, listas admin) | ✅ 7/7 |

### Frontend — 16/16 fluxos aprovados (agente de testes + verificação direcionada)
| Fluxo | Resultado |
|---|---|
| Login admin (erro com credenciais inválidas; sucesso navega ao dashboard) | ✅ |
| Criação de produto com upload PNG + imagem por URL | ✅ |
| Edição de produto (nome/preço persistem; slug estável) | ✅ |
| Reordenação de imagens (↑/↓) e imagem principal (★, prévia atualiza) | ✅ |
| Catálogo público (grid BRL, filtro cor, ordenação por preço) | ✅ |
| Página de produto (galeria, cores, quantidade, reviews, accordion) | ✅ |
| Hover desktop (troca para segunda imagem no card) | ✅ |
| Carrinho (mini-cart, quantidade, totais) | ✅ |
| Checkout demo 4 etapas (CPF/telefone/CEP com máscaras, Pix QR, pedido criado) | ✅ |
| Pedido aparece no admin | ✅ |
| Mudança de status + código de rastreio (persiste após reload) | ✅ |
| Newsletter (footer, mensagem de sucesso) | ✅ |
| Contato (formulário, mensagem de sucesso) | ✅ |
| Logout (volta para /admin/login) | ✅ |
| Sessão inválida (token adulterado redireciona ao login) | ✅ |

Observações não bloqueantes: avisos de acessibilidade (`aria-describedby` em modais), warnings do Recharts no dashboard, imagens Unsplash abortadas ocasionalmente pelo navegador.

## Bugs encontrados e corrigidos nesta auditoria
1. **`backend/.env` malformado** — `CORS_ORIGINS` e `EMERGENT_LLM_KEY` colados na mesma linha; dotenv falhava ao ler ambas. Corrigido (linhas separadas).
2. **Bloco duplicado em `server.py`** — router, CORS middleware e eventos de startup/shutdown registrados 2× no fim do arquivo. Duplicata removida.
3. **f-string sem placeholders** (lint) — corrigido em `server.py`.

## Como retestar

```bash
# Backend (suite gerada pelo agente)
cd /app && python backend_test.py

# Smoke manual
curl -s $BACKEND_URL/api/products | head
curl -s -X POST $BACKEND_URL/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'
```

Credenciais de teste: `/app/memory/test_credentials.md`. Histórico completo: `/app/test_result.md`.

## Limitações ainda mockadas
- Pagamentos (Pix QR fake, cartão sem gateway, boleto informativo)
- Conta do cliente (localStorage, sem backend)
- Consulta de CEP (mock por prefixo, não usa ViaCEP)
- Cupons fixos no código (sem CRUD no admin)
