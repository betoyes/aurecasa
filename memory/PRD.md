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
