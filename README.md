# E-commerce — Documentação Técnica

Plataforma de e-commerce completa com vitrine pública, dashboard administrativo e API REST. Desenvolvida para operação real com suporte a pagamentos (PagSeguro + Mercado Pago), cálculo de frete (Melhor Envio), autenticação segura via JWT + Google OAuth, gestão de estoque, cupons, avaliações, tickets de suporte e devolução.

---

## Índice

- [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
- [Stack Técnica](#stack-técnica)
- [Pré-requisitos](#pré-requisitos)
- [Setup Local](#setup-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Fluxos Principais](#fluxos-principais)
- [Endpoints da API](#endpoints-da-api)
- [Deploy (Render)](#deploy-render)
- [Checklist Pré-Produção](#checklist-pré-produção)
- [Roadmap de Melhorias](#roadmap-de-melhorias)

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clientes / Browsers                       │
└──────────┬──────────────────────┬───────────────────────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │   Frontend   │        │  Dashboard  │
    │  (Vitrine)   │        │   (Admin)   │
    │  React 19    │        │  React 19   │
    │  Port :5173  │        │  Port :5174 │
    └──────┬──────┘        └──────┬──────┘
           │                      │
           └──────────┬───────────┘
                      │ HTTP / REST
               ┌──────▼──────┐
               │   Backend   │
               │ Spring Boot │
               │  Port :8080 │
               └──────┬──────┘
                      │
          ┌───────────┼───────────────────┐
          │           │                   │
   ┌──────▼──┐  ┌─────▼─────┐  ┌────────▼──────┐
   │PostgreSQL│  │Cloudinary │  │ Provedores     │
   │ (Render) │  │   (CDN)   │  │ PagSeguro      │
   └──────────┘  └───────────┘  │ MercadoPago    │
                                │ Melhor Envio   │
                                │ SMTP (Email)   │
                                └────────────────┘
```

O sistema é composto por três serviços independentes que se comunicam exclusivamente via API REST. Cada serviço tem seu próprio Dockerfile e pode ser escalado individualmente.

---

## Stack Técnica

### Frontend & Dashboard
| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | React | 19 |
| Build | Vite | 7 |
| Roteamento | React Router | 7 |
| Estilo | CSS puro (sem framework) | — |
| Ícones | react-icons/fa | 5 |
| Gráficos (dashboard) | Recharts | 3 |
| Auth Google | @react-oauth/google | 0.13 |
| Anti-bot | react-google-recaptcha | 3 |
| Notificações | react-hot-toast | 2 |
| PWA | vite-plugin-pwa | 1 |

### Backend
| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Spring Boot | 4.0 |
| Linguagem | Java | 21 |
| Segurança | Spring Security + JWT (JJWT) | 0.12 |
| ORM | Spring Data JPA / Hibernate | — |
| Banco de dados | PostgreSQL | 16 |
| Validação | Jakarta Bean Validation | — |
| Imagens | Cloudinary SDK | 1.38 |
| Email | Spring Mail (SMTP) | — |
| Build | Maven Wrapper | — |
| Deploy | Docker + Render | — |

---

## Pré-requisitos

- **Docker** 24+ e **Docker Compose** 2.20+ (recomendado para setup rápido)
- **Node.js** 20+ e **npm** 10+ (desenvolvimento frontend)
- **Java** 21+ e **Maven** 3.9+ (desenvolvimento backend)
- Conta no **Render** (deploy em nuvem)
- Conta no **Cloudinary** (CDN de imagens)
- Conta no **PagSeguro** e/ou **Mercado Pago** (pagamentos)
- Conta no **Melhor Envio** (cálculo e rastreio de frete)
- Servidor de e-mail SMTP (Gmail, SendGrid, etc.)
- Projeto no **Google Cloud Console** com OAuth configurado (login Google)

---

## Setup Local

### Opção 1 — Docker Compose (recomendado)

Sobe banco de dados, backend, frontend e dashboard em um único comando.

```bash
# 1. Clone o repositório
git clone <repo-url>
cd E-commerce

# 2. Copie e configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores (veja seção Variáveis de Ambiente)

# 3. Suba todos os serviços
docker compose up --build

# Serviços disponíveis em:
# Frontend:  http://localhost:5173
# Dashboard: http://localhost:5174
# Backend:   http://localhost:8080
# Banco:     localhost:5432
```

Para desenvolvimento com hot reload:

```bash
docker compose -f docker-compose.dev.yml up
```

### Opção 2 — Manual (desenvolvimento)

**Banco de dados:**
```bash
# Sobe apenas o PostgreSQL via Docker
docker compose up postgres -d
```

**Backend:**
```bash
cd backend

# Configure as variáveis de ambiente locais em application.properties
# (ou exporte as variáveis no terminal — veja seção abaixo)

./mvnw spring-boot:run
# API disponível em http://localhost:8080
```

**Frontend:**
```bash
cd frontend
npm install

# Crie o arquivo .env local
cp .env.example .env.local
# Edite VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID, etc.

npm run dev
# http://localhost:5173
```

**Dashboard:**
```bash
cd dashboard
npm install
cp .env.example .env.local
npm run dev
# http://localhost:5174
```

### Primeiro acesso ao dashboard

O usuário **MASTER** é criado automaticamente na inicialização do backend se não existir. Configure as variáveis `APP_MASTER_EMAIL` e `APP_MASTER_PASSWORD` antes de subir o serviço.

```bash
# Exemplo (desenvolvimento local — application.properties)
app.master.email=master@local.dev
app.master.password=SenhaLocal@2025!
```

Acesse `http://localhost:5174`, faça login com essas credenciais e crie usuários ADMIN em **Usuários → Novo Admin**.

---

## Variáveis de Ambiente

### Backend (`backend/src/main/resources/application.properties` ou env vars)

| Variável | Obrigatório | Descrição |
|---|---|---|
| `SPRING_DATASOURCE_URL` | ✅ | `jdbc:postgresql://<host>:5432/<db>` |
| `SPRING_DATASOURCE_USERNAME` | ✅ | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | ✅ | Senha do banco |
| `JWT_SECRET` | ✅ | Chave HMAC-SHA (mín. 256 bits, aleatória) |
| `JWT_EXPIRATION_MS` | ✅ | TTL do token em ms (ex: `3600000` = 1h) |
| `APP_CORS_ALLOWED_ORIGINS` | ✅ | URLs do frontend/dashboard separadas por vírgula |
| `APP_MASTER_EMAIL` | ✅ | E-mail do usuário MASTER (seed inicial) |
| `APP_MASTER_PASSWORD` | ✅ | Senha do usuário MASTER (mín. 12 caracteres) |
| `APP_MASTER_FULL_NAME` | — | Nome do MASTER (padrão: `Master Admin`) |
| `SPRING_MAIL_HOST` | ✅ | Servidor SMTP (ex: `smtp.gmail.com`) |
| `SPRING_MAIL_PORT` | ✅ | Porta SMTP (ex: `587`) |
| `SPRING_MAIL_USERNAME` | ✅ | E-mail remetente |
| `SPRING_MAIL_PASSWORD` | ✅ | Senha ou App Password do e-mail |
| `CLOUDINARY_URL` | ✅ | `cloudinary://api_key:api_secret@cloud_name` |
| `PAGSEGURO_TOKEN` | ✅ | Token da conta PagSeguro |
| `PAGSEGURO_WEBHOOK_SECRET` | ✅ | Chave HMAC-SHA256 do webhook PagSeguro |
| `MERCADOPAGO_ACCESS_TOKEN` | — | Access Token do Mercado Pago |
| `MERCADOPAGO_NOTIFICATION_URL` | — | URL pública do webhook `/api/payments/webhook/mercadopago` |
| `MERCADOPAGO_REDIRECT_URL` | — | URL de retorno após pagamento |
| `MELHOR_ENVIO_TOKEN` | ✅ | Bearer token da API Melhor Envio |
| `MELHOR_ENVIO_API_URL` | ✅ | `https://melhorenvio.com.br` (produção) ou sandbox |
| `MELHOR_ENVIO_ORIGIN_ZIP` | ✅ | CEP de origem dos envios (somente dígitos) |
| `APP_GOOGLE_CLIENT_ID` | — | Client ID do Google OAuth (validação server-side) |

### Frontend e Dashboard (`.env.local`)

| Variável | Serviço | Descrição |
|---|---|---|
| `VITE_API_BASE_URL` | frontend, dashboard | URL da API (ex: `https://backend.onrender.com/api`) |
| `VITE_GOOGLE_CLIENT_ID` | frontend | Client ID do Google OAuth |
| `VITE_RECAPTCHA_SITE_KEY` | frontend | Site Key do reCAPTCHA v2 |

> **Nunca** commite arquivos `.env` ou credenciais reais no repositório.

---

## Estrutura do Projeto

```
E-commerce/
├── backend/
│   ├── src/main/java/com/ecommerce/
│   │   ├── Auth/               # Autenticação, usuários, OTP, reset de senha
│   │   │   ├── Controller/     # AuthController, AdminUserController
│   │   │   ├── Entity/         # User, PendingRegistration, PasswordResetToken
│   │   │   │   └── Dto/        # DTOs de request/response
│   │   │   ├── Repository/     # UserRepository, PendingRegistrationRepository
│   │   │   └── Service/        # AuthService, EmailService, AdminUserService
│   │   ├── Banner/             # Banners da home (CRUD admin)
│   │   ├── Cart/               # Sincronização de carrinho abandonado
│   │   ├── Category/           # Categorias de produto
│   │   ├── Config/             # SecurityConfig, CorsConfig, AdminDataInitializer
│   │   ├── Coupon/             # Cupons de desconto
│   │   ├── Favorite/           # Lista de favoritos por usuário
│   │   ├── Order/              # Pedidos e itens de pedido
│   │   ├── Payment/            # PagSeguro, Mercado Pago, webhooks
│   │   ├── Product/            # Produtos, variantes, categorias de produto
│   │   │   ├── Converter/      # StringMapConverter (atributos JSON de variante)
│   │   │   └── Entity/         # ProductCategory, ProductVariant
│   │   ├── Return/             # Solicitações de devolução/troca
│   │   ├── Review/             # Avaliações de produto
│   │   ├── Security/           # JwtUtil, JwtAuthFilter
│   │   ├── Shipping/           # Cálculo e rastreio de frete (Melhor Envio)
│   │   └── Ticket/             # Tickets de suporte ao cliente
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   └── src/
│       ├── assets/             # Imagens estáticas
│       ├── components/         # Navbar, Footer, ProductCard, CartDrawer, etc.
│       ├── context/            # AuthContext, AuthProvider, CompareContext, FavoritesProvider
│       ├── data/               # mockData.js (fallback local)
│       ├── hooks/              # useSEO.js, useRecentlyViewed.js
│       ├── pages/              # Home, Catalog, ProductDetails, Checkout, MinhaConta, etc.
│       ├── services/           # productsApi, authApi, ordersApi, checkoutApi, etc.
│       ├── App.jsx             # Roteamento + estado global do carrinho
│       └── index.css           # Design tokens + reset + utilitários globais
│
├── dashboard/
│   └── src/
│       ├── components/         # AdminNavbar, ProtectedRoute
│       ├── pages/              # GestaoProdutos, GestaoPedidos, UsuariosAdmin, etc.
│       └── services/           # apiClient.js (apiFetch com auth header)
│
├── docker-compose.yml          # Stack completa para produção local
├── docker-compose.dev.yml      # Stack com hot reload
├── render.yaml                 # Configuração de deploy no Render
├── CLAUDE.md                   # Convenções de código para LLMs
└── ROADMAP.md                  # Backlog de funcionalidades priorizado
```

### Design Tokens (CSS)

Todos os valores visuais são centralizados em [frontend/src/index.css](frontend/src/index.css). Nunca use valores hardcoded de cor, sombra ou raio de borda.

```css
/* Cores principais */
--primary: #2563EB        /* azul — links, ações secundárias */
--accent: #F97316         /* laranja — CTAs de compra */
--text: #0C0C0E
--surface: #FFFFFF
--page-bg: #F7F7F8

/* Raios */
--radius-sm: 8px   --radius: 12px   --radius-lg: 16px

/* Sombras */
--shadow-xs  --shadow-sm  --shadow-md  --shadow-lg  --shadow-xl

/* Navbar */
--navbar-h: 137px   /* altura total (promo + topo + bottom) */
```

---

## Fluxos Principais

### Cadastro de cliente

```
1. POST /api/auth/initiate-registration
   └── Valida email, CPF, telefone, CEP
   └── Cria PendingRegistration com OTP hash (BCrypt)
   └── Envia e-mail com código de 6 dígitos (TTL 10min)

2. POST /api/auth/confirm-registration
   └── Valida OTP (máx. 5 tentativas, lockout automático)
   └── Cria User com role CUSTOMER
   └── Retorna JWT (login automático)
```

### Checkout

```
1. Cliente monta carrinho (localStorage + sincronização opcional via /api/cart)
2. POST /api/checkout/session (guest) ou POST /api/checkout (autenticado)
3. PaymentService valida estoque
4. Redireciona para PagSeguro / Mercado Pago
5. Gateway chama webhook → POST /api/payments/webhook
   └── Verifica assinatura HMAC-SHA256
   └── Atualiza status do pedido
   └── Decrementa estoque por variante ou produto
   └── Envia e-mail de confirmação ao cliente
```

### Hierarquia de acesso

```
MASTER → Acesso total (inclui /api/admin/**)
ADMIN  → Gestão de produtos, pedidos, tickets, banners, cupons, avaliações
CUSTOMER → Checkout, pedidos próprios, favoritos, reviews, tickets
Público → Catálogo, detalhes de produto, cálculo de frete, validação de cupom
```

---

## Endpoints da API

Base URL: `VITE_API_BASE_URL` (padrão `http://localhost:8080/api`)

### Autenticação
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/initiate-registration` | Público | Inicia cadastro (envia OTP por email) |
| POST | `/auth/confirm-registration` | Público | Confirma OTP e cria conta |
| POST | `/auth/login` | Público | Login com email/senha + reCAPTCHA |
| POST | `/auth/google` | Público | Login com Google ID token |
| POST | `/auth/forgot-password` | Público | Envia OTP de reset de senha |
| POST | `/auth/reset-password` | Público | Confirma OTP e altera senha |
| GET | `/auth/me` | Autenticado | Dados do usuário logado |
| PATCH | `/auth/me` | Autenticado | Atualiza perfil |
| PATCH | `/auth/me/password` | Autenticado | Altera senha |
| DELETE | `/auth/me` | Autenticado | Exclui conta (LGPD) |

### Produtos
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/product-category` | Público | Lista todos os produtos |
| GET | `/product-category/:id` | Público | Detalhe do produto com variantes |
| POST | `/product-category` | ADMIN+ | Cria produto |
| PUT | `/product-category/:id` | ADMIN+ | Atualiza produto |
| DELETE | `/product-category/:id` | ADMIN+ | Remove produto |
| POST | `/product-category/:id/variants` | ADMIN+ | Cria variante |
| DELETE | `/product-category/variants/:variantId` | ADMIN+ | Remove variante |
| POST | `/product-category/import` | ADMIN+ | Importa produtos via CSV |

### Pedidos
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/orders/my` | Autenticado | Pedidos do cliente logado |
| GET | `/orders/my/:id` | Autenticado | Detalhe do pedido |
| GET | `/orders/my/:id/tracking` | Autenticado | Rastreio Melhor Envio |
| GET | `/orders` | ADMIN+ | Lista todos os pedidos |
| GET | `/orders/paginated` | ADMIN+ | Lista paginada com filtros |
| PATCH | `/orders/:id/status` | ADMIN+ | Atualiza status do pedido |
| GET | `/orders/admin/summary` | ADMIN+ | Resumo financeiro com filtro de data |

### Pagamentos
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/checkout/session` | Público | Checkout como convidado (redirect) |
| POST | `/checkout` | Autenticado | Checkout com cartão |
| GET | `/payments/public-key` | Autenticado | Chave pública para criptografia de cartão |
| POST | `/payments/webhook` | Público* | Webhook PagSeguro (validado por HMAC) |
| POST | `/payments/webhook/mercadopago` | Público* | Webhook Mercado Pago |

*Públicos na rota, mas protegidos por verificação de assinatura HMAC-SHA256.

### Demais recursos
| Módulo | Rotas públicas | Rotas autenticadas | Rotas admin |
|---|---|---|---|
| Frete | `POST /freight/calculate` | — | — |
| Cupons | `POST /coupons/validate` | — | `/admin/coupons` (CRUD) |
| Categorias | `GET /categories` | — | `/admin/categories` (CRUD) |
| Reviews | `GET /reviews/**` | `POST /reviews/**` | `/admin/reviews` |
| Banners | `GET /banners` | — | `/banners/admin/**` |
| Favoritos | — | `/favorites/**` | — |
| Tickets | — | `/tickets/**` | `/admin/tickets/**` |
| Devoluções | — | `/returns/**` | `/returns/admin/**` |
| Admin Users | — | — | `/admin/users` (MASTER only) |

---

## Deploy (Render)

O arquivo `render.yaml` na raiz define os três serviços. Para fazer deploy:

```bash
# 1. Conecte o repositório no Render Dashboard
# 2. Crie um PostgreSQL no Render e copie a connection string
# 3. Configure as variáveis de ambiente no painel do Render
#    (veja seção Variáveis de Ambiente acima)
# 4. O deploy ocorre automaticamente a cada push na branch main
```

**Variáveis obrigatórias a configurar no Render antes do primeiro deploy:**

```
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
JWT_SECRET              ← use "Generate" no Render para valor aleatório
APP_MASTER_EMAIL
APP_MASTER_PASSWORD
APP_CORS_ALLOWED_ORIGINS
SPRING_MAIL_HOST
SPRING_MAIL_PORT
SPRING_MAIL_USERNAME
SPRING_MAIL_PASSWORD
CLOUDINARY_URL
PAGSEGURO_TOKEN
PAGSEGURO_WEBHOOK_SECRET
MELHOR_ENVIO_TOKEN
MELHOR_ENVIO_ORIGIN_ZIP
```

**Configurar webhooks nos gateways de pagamento:**

- **PagSeguro:** URL de notificação → `https://seu-backend.onrender.com/api/payments/webhook`
- **Mercado Pago:** URL de notificação → `https://seu-backend.onrender.com/api/payments/webhook/mercadopago`

---

## Checklist Pré-Produção

Itens obrigatórios antes de aceitar as primeiras vendas reais. Cada item identifica o arquivo e a ação necessária.

### Segurança — Bloqueantes

- [ ] **Verificação HMAC nos webhooks de pagamento**
  Confirme que `PaymentService` valida o header `x-signature` (PagSeguro) e `x-signature` (Mercado Pago) antes de processar qualquer mudança de status de pedido. Fraude de pagamento sem essa verificação é risco financeiro direto.
  Arquivo: [backend/.../Payment/PaymentService.java](backend/src/main/java/com/ecommerce/Payment/PaymentService.java)

- [ ] **Bloqueio de conta funcional**
  `User.java` implementa `UserDetails` com `isAccountNonLocked()` retornando `true` hardcoded. Adicione o campo `locked` na entidade para que suspensões via dashboard funcionem.
  Arquivo: [backend/.../Auth/Entity/User.java](backend/src/main/java/com/ecommerce/Auth/Entity/User.java)

- [ ] **JWT — avalie migrar de localStorage para cookie HttpOnly**
  O token JWT atual é salvo em `localStorage`, acessível por qualquer script na página. O padrão mais seguro é cookie `HttpOnly; Secure; SameSite=Strict` emitido pelo backend. Se não migrar agora, documente o risco aceito.
  Arquivo: [frontend/src/context/AuthProvider.jsx](frontend/src/context/AuthProvider.jsx)

- [ ] **Remover ou desabilitar o endpoint legado de registro**
  Verifique se `AuthController` ainda expõe `POST /api/auth/register` chamando o método `register()` direto (sem OTP). Se sim, remova o mapeamento ou redirecione para `initiateRegistration`.
  Arquivo: [backend/.../Auth/Controller/AuthController.java](backend/src/main/java/com/ecommerce/Auth/Controller)

- [ ] **Rate limiting nos endpoints públicos**
  `/api/auth/login` e `/api/auth/initiate-registration` estão abertos a força bruta. Adicione `RateLimitFilter` (Bucket4j ou mapa em memória) com limite de 10 req/min por IP para login e 5 req/min para registro. Retornar HTTP 429 com `Retry-After`.

### Confiabilidade — Importantes

- [ ] **`@Transactional` em `AuthService`**
  `initiateRegistration` e `confirmRegistration` fazem múltiplas operações de escrita sem transação. Um erro no `save` do User após deletar o PendingRegistration deixa o sistema em estado inconsistente.
  Arquivo: [backend/.../Auth/Service/AuthService.java](backend/src/main/java/com/ecommerce/Auth/Service/AuthService.java)

- [ ] **Migrar `ddl-auto` para `validate` e adotar Flyway**
  `spring.jpa.hibernate.ddl-auto=update` em produção é risco de alterações de schema sem rollback. Adicione `org.flywaydb:flyway-core` ao `pom.xml`, crie `src/main/resources/db/migration/V1__init.sql` com o schema atual e mude para `ddl-auto=validate`.

- [ ] **`FetchType.EAGER` em variantes — lazy loading**
  `ProductCategory.java` carrega todas as variantes em cada consulta de produto, inclusive nas listagens do catálogo. Mude para `FetchType.LAZY` e adicione `JOIN FETCH` apenas no endpoint de detalhe do produto.
  Arquivo: [backend/.../Product/Entity/ProductCategory.java](backend/src/main/java/com/ecommerce/Product/Entity/ProductCategory.java)

- [ ] **Injeção de dependência via construtor**
  Serviços usam `@Autowired` em campos privados, o que impede testes unitários sem Spring context. Migre para `@RequiredArgsConstructor` (Lombok) + campos `final`. Melhoria de testabilidade imediata.

- [ ] **`@Data` em entidade JPA**
  `User.java` usa `@Data` que gera `equals/hashCode` baseados em todos os campos, incluindo coleções lazy — pode causar `LazyInitializationException` inesperado. Substitua por `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor` e implemente `equals/hashCode` apenas no campo `id`.

### Qualidade — Recomendados

- [ ] **Testes de integração mínimos**
  Hoje existe apenas `contextLoads()`. Adicione testes para os fluxos críticos:
  - Registro com email duplicado (deve lançar `BusinessException`)
  - Confirmação de OTP expirado
  - Confirmação de OTP com 5+ tentativas (lockout)
  - Checkout com estoque insuficiente (deve retornar HTTP 400)
  Biblioteca: `spring-boot-starter-test` + `@SpringBootTest` + banco H2 em memória para testes.

- [ ] **Validação do `audience` no Google OAuth**
  `AuthService.googleLogin()` chama `tokeninfo` da Google mas pode não validar o campo `aud`. Confirme que o backend verifica `aud == googleClientId` para evitar que tokens emitidos para outros apps sejam aceitos.

- [ ] **Limpar endpoint/método legado `register()`**
  Se o método existe mas não está mais mapeado, remova-o para evitar confusão futura.

- [ ] **Decompor `PaymentService` (645 linhas)**
  Extraia `StockService` (validar/decrementar estoque, hoje duplicado para variante e produto) e `WebhookService` (processar eventos dos gateways). Facilita testes e manutenção.

---

## Roadmap de Melhorias

O backlog completo e priorizado está em [ROADMAP.md](ROADMAP.md). Resumo dos próximos itens por prioridade:

### Crítico para escala (C)
| Item | Descrição |
|---|---|
| C1 | **CDN de imagens (Cloudinary)** — Imagens salvas como base64 no PostgreSQL travam o banco em produção com 50+ produtos |
| C2 | **Lazy loading de imagens** — `loading="lazy"` nos `<img>` de catálogo e home |
| C3 | **Rate limiting** — Proteção dos endpoints públicos contra força bruta |
| C4 | **Checkout como convidado** — Remover obrigatoriedade de login para comprar |

### Alta prioridade (A)
| Item | Descrição |
|---|---|
| A1 | Busca com autocomplete na Navbar |
| A2 | Dashboard de relatórios (receita por dia, top produtos, ticket médio) |
| A3 | JSON-LD / Schema.org nos detalhes de produto (estrelas no Google) |
| A4 | Importação de produtos via CSV |
| A5 | E-mail de recuperação de carrinho abandonado |

### Diferencial (D)
| Item | Descrição |
|---|---|
| D1 | Emissão de NF-e (NFe.io ou Focus NFe) |
| D2 | Google Analytics 4 + Meta Pixel (integrado ao CookieBanner) |
| D3 | Notificações push (Web Push API) |
| D4 | Checkout B2B (CNPJ + Inscrição Estadual) |

---

## Desenvolvimento

### Convenções de código

Leia [CLAUDE.md](CLAUDE.md) antes de qualquer contribuição. Principais regras:

- CSS puro com variáveis de design token — nunca valores hardcoded
- Componentes em `PascalCase.jsx` + `PascalCase.css`, classes CSS prefixadas pelo componente
- Handlers com prefixo `handle`, booleans com `is`/`has`/`can`
- Sem TypeScript, sem Tailwind, sem Axios (usar `fetch` nativo)
- Sem comentários que explicam o que o código já diz
- Sem `console.log` em código commitado

### Estrutura de uma página nova

```jsx
// frontend/src/pages/NovaPagina.jsx
import { useState, useEffect } from "react";
import "./NovaPagina.css";

export default function NovaPagina() {
  const [dados, setDados] = useState(null);

  useEffect(() => { /* fetch */ }, []);

  return (
    <main className="nova-main">
      <div className="container nova-container">
        {/* conteúdo */}
      </div>
    </main>
  );
}
```

### Comandos úteis

```bash
# Backend
./mvnw compile              # Compila sem subir
./mvnw test                 # Roda testes
./mvnw spring-boot:run      # Sobe em modo dev

# Frontend
npm run dev                 # Servidor de desenvolvimento
npm run build               # Build de produção
npm run preview             # Preview do build

# Docker
docker compose up --build   # Sobe tudo do zero
docker compose down -v      # Para e remove volumes
docker logs ecommerce-backend -f   # Acompanha logs do backend
```

---

## Licença

Este projeto é proprietário. Todos os direitos reservados.
