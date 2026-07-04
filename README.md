# Auré Casa

E-commerce premium brasileiro de objetos contemporâneos para casa — organização, bancada, mesa e presentes. Interface editorial em PT-BR, preços em BRL, checkout em 4 etapas (modo demo) e painel administrativo protegido por JWT.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS, shadcn/ui, framer-motion |
| Backend | FastAPI, Motor (MongoDB async), PyJWT, Resend (e-mails) |
| Banco | MongoDB |

## Estrutura

```
/app
├── backend/           # API FastAPI (server.py único) + uploads em static/uploads
├── frontend/          # SPA React (src/pages, src/components, src/lib)
├── docs/              # Documentação (arquitetura, admin, deploy, testes)
├── memory/            # PRD e credenciais de teste
└── test_result.md     # Histórico de testes dos agentes
```

## Rodando localmente

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # preencha os valores
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
yarn install
cp .env.example .env   # aponte REACT_APP_BACKEND_URL
yarn start
```

No ambiente Emergent os serviços são gerenciados pelo supervisor:
`sudo supervisorctl restart backend frontend`

## Funcionalidades

- **Loja**: home editorial, coleções com filtros (cor, preço, ordenação), busca, página de produto (galeria, cores, reviews), wishlist, mini-cart, carrinho, checkout BR 4 etapas (Pix/Cartão/Boleto — demo), confirmação de pedido.
- **Admin** (`/admin`, login JWT): dashboard com métricas, pedidos (status + código de rastreio), produtos (CRUD completo, upload de imagens, reordenação, imagem principal), newsletter, contatos.
- **E-mails**: newsletter, contato e atualização de status de pedido via Resend (opcional — sem chave, os fluxos apenas salvam no banco).

## Integrações mockadas (modo demo)

- **Pagamentos**: Pix com QR fake, cartão sem gateway, boleto informativo. Estrutura pronta para Mercado Pago/Pagar.me via env vars.
- **Conta do cliente**: login mock via localStorage (sem backend).
- **CEP**: consulta simulada por prefixo (não usa ViaCEP).

## Documentação

- [Arquitetura](docs/ARQUITETURA.md) — modelos, endpoints, fluxos
- [Admin](docs/ADMIN.md) — guia do painel administrativo
- [Deploy](docs/DEPLOY.md) — variáveis de ambiente e publicação
- [Testes](docs/TESTES.md) — resultado da auditoria E2E e como retestar
