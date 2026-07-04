# Product Requirements — Auré Casa

## Problem Statement
Build a complete, polished Brazilian e-commerce website for a premium home objects brand called "Auré Casa". Contemporary objects for home, organization, gifting, and everyday rituals — refined, warm, editorial, accessible-premium. Muuto/HAY-level restraint. Brazilian Portuguese throughout.

## User Personas
- Adultos brasileiros 28-50, urbanos, apartamentos/casas
- Valorizam estética, organização, rituais, design contemporâneo, presentes cuidadosos
- Dispostos a pagar mais por curadoria, embalagem e experiência coerente

## Core Requirements (static)
- Editorial home (hero, categorias, coleção destaque, brand block, spotlight, inspiração, newsletter)
- 8 produtos com múltiplas imagens, cores, dimensões, cuidados, reviews
- Coleções por categoria com filtros (cor, preço, disponibilidade, ordenação)
- Search, wishlist (localStorage), mini-cart drawer, cart page
- Checkout BR 4 etapas (Identificação, Entrega, Pagamento, Confirmação) com Pix/Cartão/Boleto (modo demo)
- User account mock (login localStorage)
- Admin panel com dashboard, orders, products, newsletter, contacts, settings
- Legal pages (privacidade, termos, trocas, entrega, cuidados)
- BRL formatting, PT-BR locale, SEO metadata

## Implementation Log
### 2026-07 — Segurança: sessão admin em cookie httpOnly
- /api/admin/login seta cookie httpOnly aure_admin_session (Secure, SameSite=lax, Path=/api, 7d); novo POST /api/admin/logout; require_admin aceita cookie OU Bearer (retrocompatível)
- Frontend sem token em localStorage (withCredentials; chave legada limpa); skipAuthToast no verify inicial
- Refactor: _build_products_query + _PRODUCT_SORTS extraídos de list_products (mesmo comportamento)
- useMemo no cross-sell do ProductDetail
- Regressão backend 46/46 (Bearer E cookie); smoke frontend: sem sessão→login, login cookie, reload mantém, logout, pós-logout→login — TODOS OK

### 2026-07 — Revisão de código aplicada
- Corrigidos: catches vazios (Admin.jsx, AdminProducts.jsx, adminApi.js — agora logam erros não-401), load em useCallback + deps corretas, keys de listas com identidade estável (Cart, Checkout, Confirmation, Admin pedidos, AdminProducts imagens, ProductDetail reviews), estilos do chart hoisted para constantes de módulo, aspas tipográficas em StaticPages. Lint 100% limpo. Smoke test pós-fix: dashboard+chart, pedidos, produtos, reviews, carrinho — OK.
- Falsos positivos do relatório NÃO aplicados: `is not None` (correto), random do gráfico demo (intencional/mock), deps de funções de módulo (referência estável), console.warn do craco (infra da plataforma).
- Diferidos (aguardando decisão do usuário): token admin em cookie httpOnly (refactor arquitetural), split de componentes grandes, TypeScript.

### 2026-07 — Auditoria E2E + documentação
- Auditoria completa: backend 38/38, frontend 16/16 fluxos aprovados (admin auth/CRUD/upload/reordenação/imagem principal, catálogo, PDP, hover, carrinho, checkout demo, pedidos+status+tracking, newsletter, contato, logout, sessão inválida)
- Bugs corrigidos: .env malformado (CORS_ORIGINS+EMERGENT_LLM_KEY na mesma linha), bloco duplicado no fim de server.py (router/CORS/startup 2x), f-string sem placeholder
- Docs criadas: README.md, docs/ARQUITETURA.md, docs/ADMIN.md, docs/DEPLOY.md, docs/TESTES.md, backend/.env.example, frontend/.env.example
- Credenciais admin registradas em /app/memory/test_credentials.md

### 2026-02 — MVP inicial
- Backend FastAPI com endpoints: /api/products, /api/orders, /api/coupons/validate, /api/shipping/cep, /api/newsletter (Resend), /api/contact (Resend), /api/admin/*
- MongoDB seeded com 8 produtos + reviews mock + 2 cupons demo
- Frontend React 19 com Tailwind, shadcn/ui, framer-motion
- Design: Cormorant Garamond (serif) + Outfit (sans), paleta areia/verde sálvia/terracota/lavanda, fundo ivory #F9F8F6
- Integração Resend com placeholders (RESEND_API_KEY vazio inicialmente)
- Payments: modo demo com QR fake Pix, formulário cartão, boleto info
- Admin: dashboard com chart recharts, gestão de pedidos (status), produtos (preço), newsletter/contatos read-only

## What's implemented ✅
- Home editorial completa
- 8 produtos + páginas de detalhe com galeria, cores, quantidade, reviews, cross-sell, accordion
- Coleções com filtros
- Cart + Mini-cart + Wishlist + Checkout multi-step + Confirmação
- Admin (dashboard + orders + products + newsletter + contacts + settings)
- Newsletter (Resend real) e Contact (Resend real) — funcionam mesmo sem chave, apenas salvando no DB
- Legal pages
- SEO metadata em index.html
- BRL formatting, CEP/CPF/telefone masks

## MOCKED integrations
- **Payments**: Pix QR fake, cartão sem gateway real, boleto info-only. Estrutura pronta para Mercado Pago/Pagar.me via env vars
- **Auth**: mock via localStorage (user simples)
- **Admin**: sem autenticação (usuário confirmou)
- **Product images**: Unsplash editorial. Script para Nano Banana pode ser adicionado depois

## P0 backlog
- Configurar RESEND_API_KEY real do usuário e verificar domínio
- Testar checkout end-to-end + admin CRUD

## P1 backlog
- Autenticação real (JWT ou Google OAuth via Emergent)
- Proteção do admin com role/senha
- Integração Mercado Pago/Pagar.me
- Geração de imagens dos produtos via Nano Banana (script pronto no playbook)

## P2 backlog
- Upload de imagens no admin
- Categorias/coleções custom no admin
- Cupons no admin
- Order tracking código
- Editorial content blocks no admin
