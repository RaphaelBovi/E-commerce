# Roadmap — E-commerce

## Contexto técnico

**Stack:**
- Frontend: React 19 + Vite, CSS puro, React Router v7, react-hot-toast, react-icons/fa
- Dashboard: Vite separado em `dashboard/` — usa `apiFetch()` de `dashboard/src/services/apiClient.js`
- Backend: Spring Boot 4 + PostgreSQL (Render), JWT stateless, Flyway migrations
- API base: `VITE_API_BASE_URL` (padrão `http://localhost:8080/api`)
- Config: `application.yml` (JWT, mail, reCAPTCHA, PagSeguro API URL) + `application.properties` (banco, Flyway, CORS, gateways, Cloudinary)

**Entidade central de produto:** `ProductCategory.java`
- Campos: `id` (UUID), `name`, `ref`, `price`, `promotionalPrice`, `isPromo`, `qnt`, `marca`, `category`, `image` (TEXT), `images` (List), `weightKg`, `widthCm`, `heightCm`, `lengthCm`, `createdAt`
- Variantes: `ProductVariant.java` com `id`, `productId`, `name`, `sku`, `price`, `qnt`, `attributes` (JSON Map)

**Auth:**
- JWT em `localStorage` → `Authorization: Bearer <token>`
- Roles: `CUSTOMER`, `ADMIN`, `MASTER`
- `SecurityConfig.java` controla acesso por rota
- `useAuth()` expõe `{ user, isAuthenticated, login, logout }` — `user.role`

---

## 🚀 Amanhã — Pré-Lançamento

> Todos esses itens são de configuração e código. Nenhum exige nova feature — são ajustes para a loja funcionar corretamente em produção.

---

### P1 · Consolidar application.yml + application.properties

**Problema:** O projeto tem dois arquivos de configuração com responsabilidades sobrepostas. O `application.yml` guarda JWT, mail, reCAPTCHA e PagSeguro API URL. O `application.properties` guarda banco, Flyway, CORS, gateways e Cloudinary. Além de confuso, os defaults de CORS diferem entre os dois arquivos — `yml` só tem localhost, `properties` tem o dashboard do Render. Isso vai gerar dúvida em toda manutenção futura.

**O que fazer:**
- Mover todas as propriedades do `application.yml` para o `application.properties`
- Deletar `application.yml` após a migração
- Garantir que o `application.properties` final tenha todos os blocos abaixo:

```properties
# JWT
app.jwt.secret=${JWT_SECRET:dev-secret-key-change-in-production-min-256-bits}
app.jwt.expiration-ms=${JWT_EXPIRATION_MS:86400000}

# Mail
spring.mail.host=${SPRING_MAIL_HOST:}
spring.mail.port=${SPRING_MAIL_PORT:587}
spring.mail.username=${SPRING_MAIL_USERNAME:}
spring.mail.password=${SPRING_MAIL_PASSWORD:}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
app.mail.from=${MAIL_FROM:noreply@sualoja.com}

# Google OAuth + reCAPTCHA
app.google.client-id=${GOOGLE_CLIENT_ID:}
google.recaptcha.secret=${GOOGLE_RECAPTCHA_SECRET:}

# PagSeguro (mantido em sandbox até comercialização da plataforma)
pagseguro.token=${PAGSEGURO_TOKEN:}
pagseguro.api-url=${PAGSEGURO_API_URL:https://sandbox.api.pagseguro.com}
pagseguro.notification-url=${PAGSEGURO_NOTIFICATION_URL:}
pagseguro.redirect-url=${PAGSEGURO_REDIRECT_URL:http://localhost:5173/minha-conta}
```

**Verificar:** após subir o backend, checar nos logs que `jwt.secret` não está usando o valor default de dev.

---

### P2 · CORS — adicionar domínio do frontend de produção

**Problema:** `APP_CORS_ALLOWED_ORIGINS` no Render precisa incluir o domínio onde o frontend está publicado. Se o frontend estiver em outro subdomínio do Render (ex: `https://ecommerce-frontend-xxxx.onrender.com`) e esse domínio não estiver na lista, **todas as requisições do browser falharão com erro CORS** — a loja vai estar no ar mas completamente quebrada para os clientes.

**O que fazer:**
1. Acessar o Render → serviço do backend → Environment Variables
2. Localizar `APP_CORS_ALLOWED_ORIGINS`
3. Garantir que o valor inclua **todos** os domínios ativos:
   ```
   https://ecommerce-dashboard-wfvy.onrender.com,https://<url-do-frontend>.onrender.com
   ```
4. Se o frontend ainda não tiver domínio próprio, adicionar quando for publicado

**Verificar:** no browser, abrir o frontend de produção, abrir DevTools → Network → checar se alguma request retorna erro `CORS policy`.

---

### P3 · JWT Secret forte em produção

**Problema:** O `JWT_SECRET` no `application.yml` tem fallback `dev-secret-key-change-in-production-min-256-bits`. Se essa variável não estiver configurada no Render, **todos os tokens JWT são assinados com esse segredo fraco e previsível**, permitindo que qualquer pessoa forge tokens de admin.

**O que fazer:**
1. Gerar um segredo seguro (mínimo 64 chars hex):
   ```bash
   openssl rand -hex 64
   ```
2. No Render → backend → Environment Variables → adicionar:
   ```
   JWT_SECRET=<valor gerado acima>
   ```

**Verificar:** nos logs do backend ao subir, confirmar que não aparece o aviso de chave fraca (se implementado) ou simplesmente confirmar que a variável está configurada no painel do Render.

---

### P4 · reCAPTCHA — chave secreta em produção

**Problema:** `RecaptchaService.java` lê `${google.recaptcha.secret:}`. Se `GOOGLE_RECAPTCHA_SECRET` não estiver configurado no Render, o serviço entra em modo permissivo (aceita qualquer token), inutilizando a proteção anti-bot no cadastro e checkout.

**O que fazer:**
1. No Render → backend → Environment Variables → confirmar que existe:
   ```
   GOOGLE_RECAPTCHA_SECRET=<chave secreta do Google reCAPTCHA>
   ```
2. A chave pública já está no frontend (`.env.production`): `VITE_RECAPTCHA_SITE_KEY=6LcK...`
3. Confirmar que o par chave pública/privada é do mesmo site cadastrado no Google reCAPTCHA Admin

**Onde obter:** [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) → selecionar o site → Configurações → Chaves

---

### P5 · Webhook URLs dos gateways de pagamento

**Problema:** PagSeguro e Mercado Pago precisam de uma URL pública para notificar o backend quando um pagamento muda de status. Se `PAGSEGURO_NOTIFICATION_URL` e `MERCADOPAGO_NOTIFICATION_URL` não estiverem configurados, pedidos ficam travados em `PENDING` — **o estoque não é decrementado e o cliente não recebe confirmação por email**.

**O que fazer:**
1. No Render → backend → Environment Variables:
   ```
   PAGSEGURO_NOTIFICATION_URL=https://ecommerce-backend-lkv7.onrender.com/api/payments/webhook
   MERCADOPAGO_NOTIFICATION_URL=https://ecommerce-backend-lkv7.onrender.com/api/payments/webhook/mercadopago
   ```
2. No painel do PagSeguro Sandbox: configurar a mesma URL em Webhooks
3. No painel do Mercado Pago: configurar a URL de notificação nas configurações de integração
4. Testar fazendo um pedido de teste e verificar no log do Render se o webhook é recebido:
   ```
   grep "webhook" <logs do Render>
   ```

---

### P6 · Variáveis de ambiente — checklist completo no Render

Antes de abrir para clientes, confirmar que **todas** estão configuradas no Render (sem valor em branco):

| Variável | Obrigatório | Status |
|---|---|---|
| `SPRING_DATASOURCE_URL` | Sim | Banco PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | Sim | — |
| `SPRING_DATASOURCE_PASSWORD` | Sim | — |
| `JWT_SECRET` | Sim | Mínimo 64 chars |
| `GOOGLE_CLIENT_ID` | Sim | Login Google |
| `GOOGLE_RECAPTCHA_SECRET` | Sim | Anti-bot |
| `APP_MASTER_EMAIL` | Sim | Conta admin inicial |
| `APP_MASTER_PASSWORD` | Sim | Mínimo 12 chars |
| `APP_CORS_ALLOWED_ORIGINS` | Sim | Domínios do frontend + dashboard |
| `SPRING_MAIL_HOST` | Sim | SMTP (email já funciona) |
| `SPRING_MAIL_USERNAME` | Sim | — |
| `SPRING_MAIL_PASSWORD` | Sim | — |
| `PAGSEGURO_TOKEN` | Sim | Token sandbox OK |
| `PAGSEGURO_NOTIFICATION_URL` | Sim | URL do webhook |
| `PAGSEGURO_WEBHOOK_SECRET` | Sim | Verificação HMAC |
| `MERCADOPAGO_ACCESS_TOKEN` | Sim | Token de produção/sandbox |
| `MERCADOPAGO_NOTIFICATION_URL` | Sim | URL do webhook |
| `MELHOR_ENVIO_TOKEN` | Sim | Cálculo de frete |
| `MELHOR_ENVIO_ORIGIN_ZIP` | Sim | CEP de origem |
| `CLOUDINARY_URL` | Recomendado | Upload de imagens (ver C1) |

---

### P7 · Teste de ponta a ponta antes de divulgar

Roteiro de smoke test para executar após configurar tudo acima:

1. **Cadastro:** criar conta nova → receber email com OTP → confirmar → login
2. **Google Login:** entrar com conta Google → perfil carregado
3. **Catálogo:** listar produtos → abrir detalhe → variantes aparecem
4. **Frete:** no checkout, digitar CEP → opções de frete aparecem com preço
5. **Cupom:** aplicar cupom válido → desconto aplicado no total
6. **Checkout sandbox:** finalizar pedido com PagSeguro sandbox → pedido aparece em "Minha Conta" com status `PENDING`
7. **Webhook:** no painel do PagSeguro sandbox, simular pagamento aprovado → status muda para `PAID` → email de confirmação chega
8. **Admin:** logar com conta MASTER → acessar dashboard → criar produto → produto aparece no frontend

---

## ✅ Concluído

- **Estoque:** `decrementStock`/`incrementStock` em `ProductCategory.java`, `StockService` extraído do `PaymentService`, restauração em cancelamento
- **Webhook PagSeguro:** HMAC-SHA256 em `PaymentController` + `WebhookService` (extraído do `PaymentService`)
- **Webhook Mercado Pago:** `handleMercadoPago()` em `WebhookService`
- **Rate Limiting:** `RateLimitFilter.java` — sliding window por IP em login, register/initiate, freight, coupons (retorna 429)
- **Flyway:** `V1__init_schema.sql` (16 tabelas), `V2__add_locked_column_to_users.sql`, `ddl-auto=validate`
- **Testes unitários:** `AuthServiceTest` (10 testes — duplicate email/CPF, OTP expirado, lockout, OTP correto) + `StockServiceTest` (11 testes — estoque suficiente/insuficiente, variante, decrement, restore)
- **Lazy loading de variantes:** `FetchType.LAZY` em `ProductCategory.variants` + `JOIN FETCH` no endpoint de detalhe
- **Constructor injection:** `AuthService` e `PaymentService` migrados de `@Autowired` campo para construtor (`@RequiredArgsConstructor`)
- **User.locked:** campo `locked`, `isAccountNonLocked()`, sem `@Data` (risco de `LazyInitializationException`)
- **Registro em duas etapas:** `initiateRegistration` + `confirmRegistration` com OTP, `@Transactional`, endpoint legado `register()` removido
- **Carrinho persistido:** localStorage em `App.jsx`, limpo no logout
- **Email:** OTP de cadastro, recuperação de senha, confirmação de pedido, status update
- **Rastreio Melhor Envio:** `MelhorEnvioTrackingService`, endpoint `GET /api/orders/my/{id}/tracking`, timeline em `MinhaConta.jsx`
- **Cupons:** entidade `Coupon`, validação, admin CRUD, campo no `Checkout.jsx`
- **Reviews:** `Review.java`, endpoints, estrelas no `ProductCard.jsx`, seção em `ProductDetails.jsx`
- **Paginação admin:** pedidos com filtros de status/email, produtos com paginação client-side
- **SEO:** `useSEO.js`, `robots.txt`, `sitemap.xml`, Open Graph, Twitter Cards
- **LGPD:** `CookieBanner.jsx`, `PoliticaPrivacidade.jsx`, `TermosDeUso.jsx`, `DELETE /api/auth/me`
- **Frete real:** `FreightService` + Melhor Envio, seleção de opção no `Checkout.jsx`
- **Categorias:** `Category.java`, filtro do catálogo via API
- **Toasts:** react-hot-toast em todo o app
- **Breadcrumb:** `Breadcrumb.jsx` em `Catalog.jsx`, `Promocoes.jsx`, `MinhaConta.jsx`
- **Skeleton loading:** `SkeletonDetails` em `ProductDetails.jsx`, `SkeletonCard` em `Catalog.jsx`
- **404:** `NotFound.jsx` com rota `path="*"`
- **Comparação:** `CompareContext.jsx`, `CompareBar.jsx`, `Comparar.jsx` (máx. 3 produtos)
- **Tickets de suporte:** `Ticket.java`, endpoints, seção em `MinhaConta.jsx`, `TicketsAdmin.jsx`
- **Contas admin:** `AdminUserController`, `AdminDataInitializer` (seed MASTER via env vars), `UsuariosAdmin.jsx`
- **Devoluções:** `ReturnRequest.java`, endpoints customer e admin, `DevolucoesAdmin.jsx`
- **Carrinho abandonado:** `AbandonedCart.java`, `AbandonedCartService`, `CartSyncController`
- **Banners:** `Banner.java`, `BannerController`, `BannersAdmin.jsx`, `Home.jsx` usa API
- **Variantes:** `ProductVariant.java`, seletor em `ProductDetails.jsx`, CRUD no dashboard
- **Headers de segurança:** HSTS, CSP, X-Frame-Options, Referrer-Policy via `SecurityConfig`

---

## 🔴 Crítico para escala

### C1 · Imagens em CDN (Cloudinary)

**Problema:** Imagens salvas como base64 TEXT no PostgreSQL. Com 50+ produtos o banco fica gigante, as respostas da API ficam lentas e o Render free tier pode estoura limites de armazenamento.

**Backend:**
- `CloudinaryService.java` já existe em `com.ecommerce.Config` — verificar se está sendo chamado em `ProductService`
- Se não estiver integrado: em `ProductService.create()` e `update()`, se `request.image` começa com `data:image`, chamar `cloudinaryService.upload()` e salvar URL em vez de base64
- Env vars: `CLOUDINARY_URL` (formato `cloudinary://api_key:api_secret@cloud_name`)

**Verificar:** criar produto com imagem → `product.images[0]` começa com `https://res.cloudinary.com`

---

### C2 · Lazy Loading de Imagens

**Problema:** Todas as imagens do catálogo carregam ao abrir a página — sem `loading="lazy"`. Em catálogos com 30+ produtos, isso gera uma requisição de rede para cada imagem na carga inicial.

**Arquivos:**
- `frontend/src/components/ProductCard.jsx`: adicionar `loading="lazy"` no `<img>`
- `frontend/src/pages/ProductDetails.jsx`: `loading="lazy"` nas thumbnails (não na imagem principal)
- `frontend/src/pages/Home.jsx`: qualquer `<img>` abaixo do fold

---

## 🟠 Alta Prioridade

### A1 · Busca com Autocomplete na Navbar

**Frontend — `Navbar.jsx`:**
- `<input>` de busca com debounce de 300ms
- Filtrar `products` pelo nome/ref — dropdown com até 6 sugestões (thumbnail + nome + preço)
- Clicar → navega para `/produto/:ref`; Enter → `/catalogo?q=<termo>`
- Fechar ao clicar fora (`useRef` + `useEffect` com `mousedown`)

---

### A2 · Dashboard de Relatórios

**Backend — novo endpoint:**
```
GET /api/orders/admin/summary?from=2025-01-01&to=2025-12-31
```
Retorna: `totalRevenue`, `totalOrders`, `avgOrderValue`, `ordersByStatus`, `revenueByDay[]`, `topProducts[]`

**Dashboard:**
- Nova página `RelatoriosAdmin.jsx`: cards de KPI, gráfico de receita por dia (SVG ou recharts), tabela top 10 produtos, seletor de período

---

### A3 · JSON-LD / Dados Estruturados (Schema.org)

**Frontend — `ProductDetails.jsx`:**
```jsx
useEffect(() => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'product-jsonld';
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.[0] || product.image,
    "sku": product.ref,
    "brand": { "@type": "Brand", "name": product.marca },
    "offers": {
      "@type": "Offer",
      "price": product.isPromo ? product.promotionalPrice : product.price,
      "priceCurrency": "BRL",
      "availability": product.qnt > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
    }
  });
  document.head.appendChild(script);
  return () => document.getElementById('product-jsonld')?.remove();
}, [product]);
```

---

### A4 · Importação de Produtos via CSV

**Backend:** `POST /api/product-category/import` (ADMIN+, multipart/form-data) com Apache Commons CSV
- Colunas: `name,ref,price,promotionalPrice,qnt,marca,category,weightKg,widthCm,heightCm,lengthCm`
- Retorna `{ imported: N, errors: [{ row, message }] }`

**Dashboard:** botão "Importar CSV" em `GestaoProdutos.jsx` + link para template

---

### A5 · Email Templates HTML

**Backend — `EmailService.java`:**
- Thymeleaf para templates HTML (já vem no Spring Boot)
- `resources/templates/email/order-confirmation.html` e `status-update.html`
- Layout: logo, cores da marca, tabela de itens, botão CTA, rodapé

---

## 🟡 Média Prioridade

### M1 · Produtos Recentemente Visualizados

**Frontend — puro localStorage:**
- `useRecentlyViewed.js`: ao abrir `ProductDetails.jsx`, salvar `product.id` em `localStorage` (array de até 8, FIFO)
- `Home.jsx`: seção "Vistos recentemente" com `ProductCard`

---

### M2 · PWA / Service Worker

- `vite-plugin-pwa` no `frontend/`
- Manifest + cache de assets estáticos via Workbox
- Não cachear chamadas de API

---

## 🔵 Diferencial Competitivo

### D1 · Nota Fiscal (NF-e)

Integração com NFe.io ou Focus NFe. Emitir após `PAID`. Env vars: `NFE_API_KEY`, `NFE_COMPANY_ID`. Link de download em `MinhaConta.jsx`.

### D2 · Google Analytics 4 + Meta Pixel

Scripts em `frontend/index.html`. Eventos: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`. Integrar com `CookieBanner.jsx` (não disparar se cookie negado).

### D3 · Notificações Push

Service worker (M2 primeiro). Backend: salvar `PushSubscription` por usuário. Disparar ao mudar status do pedido.

### D4 · Checkout B2B (CNPJ)

Campo de CNPJ + Inscrição Estadual no checkout. Emitir NF-e com dados da empresa (D1 necessário).

### D5 · Carrinho Compartilhável

`POST /api/cart/share` → snapshot com token UUID → URL `/carrinho/:token`. Botão "Compartilhar" em `CartDrawer.jsx`.

---

## Referência rápida de arquivos

| Domínio | Backend | Frontend/Dashboard |
|---|---|---|
| Produtos | `ProductCategory.java`, `ProductService`, `ProductCategoryController` | `GestaoProdutos.jsx`, `ProductCard.jsx`, `ProductDetails.jsx` |
| Variantes | `ProductVariant.java`, `ProductVariantRepository` | `ProductDetails.jsx` (seletor), `GestaoProdutos.jsx` (aba Variantes) |
| Pedidos | `Order.java`, `OrderService`, `OrderController` | `GestaoPedidos.jsx`, `MinhaConta.jsx` |
| Pagamento | `PaymentService`, `StockService`, `WebhookService`, `PaymentController` | `Checkout.jsx`, `checkoutApi.js` |
| Auth | `User.java`, `AuthService`, `AuthController`, `SecurityConfig` | `AuthProvider.jsx`, `useAuth.js`, `authApi.js` |
| Frete | `FreightService`, `FreightController` | `Checkout.jsx` (step 2), `freightApi.js` |
| Categorias | `Category.java`, `CategoryController`, `AdminCategoryController` | `CategoriasAdmin.jsx`, `categoriesApi.js` |
| Cupons | `Coupon.java`, `CouponService`, `CouponController` | `CuponsAdmin.jsx`, `Checkout.jsx` |
| Reviews | `Review.java`, `ReviewService`, `ReviewController` | `ProductDetails.jsx`, `ReviewsAdmin.jsx` |
| Favoritos | `Favorite.java`, `FavoriteService`, `FavoriteController` | `FavoritesProvider.jsx`, `Favoritos.jsx` |
| Suporte | `Ticket.java`, `TicketService`, `TicketController` | `MinhaConta.jsx`, `TicketsAdmin.jsx` |
| Devoluções | `ReturnRequest.java`, `ReturnController` | `MinhaConta.jsx`, `DevolucoesAdmin.jsx` |
| Carrinho abandonado | `AbandonedCart.java`, `AbandonedCartService` | `App.jsx` (sync) |
| Banners | `Banner.java`, `BannerController` | `BannersAdmin.jsx`, `Home.jsx` |
| SEO | `useSEO.js` | `index.html`, `robots.txt`, `sitemap.xml` |
| Email | `EmailService.java` | — |
| Imagens | `CloudinaryService.java` | `GestaoProdutos.jsx` |
