# Roadmap — E-commerce

## Contexto técnico (leia antes de implementar qualquer item)

**Stack:**
- Frontend: React 19 + Vite, CSS puro, React Router v7, react-hot-toast, react-icons/fa
- Dashboard: Vite separado em `dashboard/` — usa `apiFetch()` de `dashboard/src/services/apiClient.js`
- Backend: Spring Boot, PostgreSQL (Render), JWT auth
- API base: `VITE_API_BASE_URL` (padrão `http://localhost:8080/api`)

**Entidade central de produto:** `ProductCategory.java`
- Campos: `id` (UUID), `name`, `ref`, `price`, `promotionalPrice`, `isPromo`, `qnt`, `marca`, `category` (slug), `image` (TEXT base64), `images` (List\<String\> base64), `weightKg`, `widthCm`, `heightCm`, `lengthCm`, `averageRating`, `reviewCount`, `createdAt`

**Auth:**
- Token JWT em `localStorage` → `Authorization: Bearer <token>`
- Roles: `CUSTOMER`, `ADMIN`, `MASTER`
- `SecurityConfig.java` controla acesso por rota
- `useAuth()` expõe `{ user, isAuthenticated, login, logout }` — `user.role`

**Convenções de código:**
- CSS: sempre variáveis (`var(--primary)`, `var(--accent)`, `var(--surface)`, etc.) — tokens em `frontend/src/index.css`
- Componentes: PascalCase.jsx + PascalCase.css, classes CSS prefixadas pelo componente
- Handlers: prefixo `handle`, booleans: `is`/`has`/`can`
- Sem TypeScript, sem Tailwind, sem Axios (usar fetch API)

**Serviços frontend existentes:**
`productsApi.js`, `authApi.js`, `ordersApi.js`, `categoriesApi.js`, `freightApi.js`, `couponsApi.js`, `reviewsApi.js`, `favoritesApi.js`, `ticketsApi.js`

---

## ✅ Concluído

- **Estoque:** `decrementStock`/`incrementStock` em `ProductCategory.java`, validação em `PaymentService`, restauração em cancelamento
- **Webhook PagSeguro:** HMAC-SHA256 em `PaymentController` + `PaymentService`
- **Carrinho persistido:** localStorage em `App.jsx`, limpo no logout
- **Email:** confirmação de pedido + status update em `EmailService.java`
- **Rastreio Melhor Envio:** `MelhorEnvioTrackingService`, endpoint `GET /api/orders/my/{id}/tracking`, timeline em `MinhaConta.jsx`
- **Cupons:** entidade `Coupon`, `CouponService`, `CouponController` (`POST /api/coupons/validate`), `AdminCouponController` (`/api/admin/coupons`), `CuponsAdmin.jsx`, campo no `Checkout.jsx`
- **Reviews:** `Review.java`, `ReviewService`, `ReviewController` (`/api/reviews`), `AdminReviewController`, `ReviewsAdmin.jsx`, seção em `ProductDetails.jsx`, estrelas no `ProductCard.jsx`
- **Paginação admin:** `OrderController` tem `GET /api/orders/paginated`, `GestaoPedidos.jsx` usa com filtros de status/email; `GestaoProdutos.jsx` tem paginação client-side (20/página)
- **SEO:** `useSEO.js` (title, description, og:*, twitter:*, robots), `robots.txt`, `sitemap.xml`
- **LGPD:** `CookieBanner.jsx`, `PoliticaPrivacidade.jsx`, `TermosDeUso.jsx`, `DELETE /api/auth/me`
- **Frete real:** `FreightService` + Melhor Envio, `FreightController` (`POST /api/freight/calculate`), seleção de opção no `Checkout.jsx`
- **Categorias:** entidade `Category.java`, `CategoryController` (`GET /api/categories`), `AdminCategoryController`, `CategoriasAdmin.jsx`, filtro do catálogo usa API
- **Toasts:** react-hot-toast em todo o app (carrinho, favoritos, cupom, comparação)
- **Breadcrumb:** `Breadcrumb.jsx` em `Catalog.jsx`, `Promocoes.jsx`, `MinhaConta.jsx`; `ProductDetails.jsx` tem nav própria
- **Skeleton loading:** `SkeletonDetails` em `ProductDetails.jsx`, `SkeletonCard` em `Catalog.jsx`
- **404:** `NotFound.jsx` com rota `path="*"` em `App.jsx`
- **Comparação:** `CompareContext.jsx`, `CompareBar.jsx`, `Comparar.jsx` (máx. 3 produtos)
- **Tickets de suporte:** `Ticket.java`, `TicketController`, `AdminTicketController`, `TicketsAdmin.jsx`, seção em `MinhaConta.jsx`
- **Contas admin:** `AdminUserController` (`POST/GET /api/admin/users`), `AdminDataInitializer` (seed MASTER via env vars), `UsuariosAdmin.jsx`
- **Open Graph:** `useSEO.js` gerencia og:title, og:description, og:image, og:url; `ProductDetails.jsx` passa imagem do produto

---

## 🔴 Crítico para operação real

### C1 · Imagens em CDN (Cloudinary)

**Problema:** Imagens salvas como base64 TEXT no PostgreSQL. Com 50+ produtos o banco fica gigante, as respostas da API ficam lentas e o Render free tier estoura limites.

**Backend:**
- Adicionar dependência Cloudinary SDK (`com.cloudinary:cloudinary-http5`)
- Criar `CloudinaryService.java` com método `upload(byte[] bytes, String folder)` → retorna URL pública
- Em `ProductService.create()` e `update()`: se `request.image` começa com `data:image`, chamar `cloudinaryService.upload()` e salvar URL em vez de base64
- Mesmo para cada item de `request.images`
- Env vars: `CLOUDINARY_URL` (formato `cloudinary://api_key:api_secret@cloud_name`)

**Dashboard (`GestaoProdutos.jsx`):** sem mudança — já envia base64, o backend converte

**Validação:** criar produto com imagem → `product.images[0]` no response começa com `https://res.cloudinary.com`

---

### C2 · Lazy Loading de Imagens

**Problema:** Todas as imagens do catálogo carregam ao abrir a página — sem `loading="lazy"`.

**Arquivos:**
- `frontend/src/components/ProductCard.jsx` linha ~117: adicionar `loading="lazy"` no `<img>`
- `frontend/src/pages/ProductDetails.jsx`: adicionar `loading="lazy"` nas thumbnails (não na imagem principal)
- `frontend/src/pages/Home.jsx`: qualquer `<img>` que esteja abaixo do fold

---

### C3 · Rate Limiting nos Endpoints Públicos

**Problema:** `/api/auth/login`, `/api/auth/register`, `/api/freight/calculate`, `/api/coupons/validate` sem proteção contra força bruta.

**Backend:**
- Adicionar dependência `bucket4j-spring-boot-starter` ou usar `spring-boot-starter-cache` + mapa em memória
- Criar `RateLimitFilter.java` (implementa `OncePerRequestFilter`)
- Limites sugeridos: login → 10 req/min por IP; register → 5 req/min por IP; freight/coupon → 20 req/min por IP
- Retorna `429 Too Many Requests` com header `Retry-After`
- Configurar os paths em `SecurityConfig.java`

---

### C4 · Checkout como Convidado

**Problema:** `Checkout.jsx` exige login (rota protegida por `ProtectedRoute`). Isso reduz conversão drasticamente.

**Frontend:**
- Remover `ProtectedRoute` da rota `/checkout` em `App.jsx`
- Em `Checkout.jsx` Step 1: se `!isAuthenticated`, mostrar campo de e-mail (obrigatório) e CPF para identificação
- Em `Checkout.jsx` Step 3: ao submeter, enviar `guestEmail` no body do checkout se não autenticado
- `createCheckoutSession()` em `checkoutApi.js`: adicionar campo `guestEmail` opcional

**Backend:**
- `CreateCheckoutSessionRequest.java`: adicionar campo `String guestEmail` (nullable)
- `PaymentService.processCheckout()`: se usuário não autenticado e `guestEmail` presente, criar pedido sem userId (ou com userId nulo) e enviar confirmação para `guestEmail`
- `Order.java`: campo `guestEmail` nullable

---

## 🟠 Alta Prioridade

### A1 · Busca com Autocomplete na Navbar

**Problema:** Não há busca global acessível — usuário precisa ir ao catálogo para filtrar.

**Frontend:**
- `Navbar.jsx`: adicionar `<input>` de busca com debounce de 300ms
- Ao digitar, filtrar os `products` (já carregados em `App.jsx`) pelo nome/ref
- Exibir dropdown com até 6 sugestões (thumbnail pequena + nome + preço)
- Clicar em sugestão → navega para `/produto/:id`
- Pressionar Enter → navega para `/catalogo?q=<termo>`
- Fechar ao clicar fora (`useRef` + `useEffect` com `mousedown`)
- `products` precisa ser passado para `Navbar` via prop ou Context

**CSS:** `.navbar-search`, `.search-dropdown`, `.search-suggestion-item`

---

### A2 · Dashboard de Relatórios

**Problema:** Admin não tem visibilidade de receita, conversão ou produtos mais vendidos.

**Backend — `OrderController.java`:**
```
GET /api/orders/admin/summary?from=2025-01-01&to=2025-12-31
```
Retorna:
```json
{
  "totalRevenue": 0.00,
  "totalOrders": 0,
  "avgOrderValue": 0.00,
  "ordersByStatus": { "PAID": 0, "SHIPPED": 0, ... },
  "revenueByDay": [{ "date": "2025-01-01", "revenue": 0.00 }],
  "topProducts": [{ "productId": "", "name": "", "qtySold": 0, "revenue": 0.00 }]
}
```
Query com `@Query` no `OrderRepository` somando `order_items.price * quantity` agrupado por dia e por produto.

**Dashboard:**
- Nova página `RelatoriosAdmin.jsx` + `RelatoriosAdmin.css`
- Cards de KPI: Receita total, Pedidos, Ticket médio, Cancelamentos
- Gráfico de receita por dia (usar `<svg>` simples ou biblioteca leve como `recharts`)
- Tabela top 10 produtos mais vendidos
- Seletor de período (últimos 7d / 30d / 90d / personalizado)
- Adicionar rota `/relatorios` no `dashboard/src/App.jsx` e link no `AdminNavbar.jsx`

---

### A3 · JSON-LD / Dados Estruturados (Schema.org)

**Problema:** Google não exibe estrelas e preço nos resultados de busca sem structured data.

**Frontend — `ProductDetails.jsx`:**
```jsx
// Dentro do componente, após ter o produto:
useEffect(() => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'product-jsonld';
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.[0] || product.image,
    "description": `${product.name} — ${product.marca}`,
    "sku": product.ref,
    "brand": { "@type": "Brand", "name": product.marca },
    "offers": {
      "@type": "Offer",
      "price": product.isPromo ? product.promotionalPrice : product.price,
      "priceCurrency": "BRL",
      "availability": product.qnt > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
    },
    ...(product.reviewCount > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.averageRating,
        "reviewCount": product.reviewCount
      }
    })
  });
  document.head.appendChild(script);
  return () => document.getElementById('product-jsonld')?.remove();
}, [product]);
```

---

### A4 · Importação de Produtos via CSV

**Problema:** Cadastrar catálogo grande pelo formulário é inviável.

**Backend:**
- Endpoint `POST /api/product-category/import` (ADMIN+, multipart/form-data)
- Parsear CSV com Apache Commons CSV (dependência `commons-csv`)
- Colunas esperadas: `name,ref,price,promotionalPrice,qnt,marca,category,weightKg,widthCm,heightCm,lengthCm`
- Retornar `{ imported: N, errors: [{ row: N, message: "..." }] }`
- `SecurityConfig`: adicionar permissão para ADMIN e MASTER

**Dashboard — `GestaoProdutos.jsx`:**
- Botão "Importar CSV" ao lado de "Novo Produto"
- Input `type="file" accept=".csv"` → POST para `/api/product-category/import`
- Exibir resultado: "X produtos importados" + lista de erros se houver
- Link para download de template CSV com as colunas corretas

---

### A5 · Recuperação de Carrinho Abandonado

**Problema:** Cliente adiciona ao carrinho, não finaliza — nenhum follow-up.

**Backend:**
- Nova entidade `AbandonedCart.java`: `userId`, `items` (JSON), `createdAt`, `emailSentAt` (nullable)
- Endpoint `POST /api/cart/sync` (autenticado): salva/atualiza carrinho do usuário no banco
- `ScheduledTask.java` (`@Scheduled(cron = "0 0 * * * *")`): busca carrinhos com `emailSentAt IS NULL` e `createdAt < NOW() - 2h`, envia email via `EmailService`, atualiza `emailSentAt`
- Email: "Você esqueceu algo!" com lista de itens e link para `/catalogo`

**Frontend — `App.jsx`:**
- Quando `isAuthenticated` e `cartItems.length > 0`: chamar `POST /api/cart/sync` com debounce de 5s após mudança no carrinho
- Quando `cartItems` esvazia ou usuário finaliza compra: chamar `DELETE /api/cart/sync` para remover do banco

---

### A6 · Gestão de Banners da Home via Admin

**Problema:** Conteúdo da `Home.jsx` (banners, destaques) está hardcoded — qualquer mudança exige deploy.

**Backend:**
- Nova entidade `Banner.java`: `id`, `title`, `subtitle`, `imageUrl`, `linkUrl`, `position` (enum: HERO, PROMO_BAR, FEATURED), `active`, `order` (int), `createdAt`
- `BannerController` (`GET /api/banners?position=HERO` — público; `POST/PUT/DELETE /api/admin/banners` — ADMIN+)

**Dashboard:**
- Nova página `BannersAdmin.jsx`: lista de banners por posição, toggle ativo, reordenar (drag ou botões ↑↓), upload de imagem, link de destino

**Frontend — `Home.jsx`:**
- `useEffect`: buscar `GET /api/banners?position=HERO` e substituir o hero hardcoded
- Fallback: se API falhar, mostrar banner padrão estático

---

### A7 · Devolução/Troca Self-Service

**Problema:** Cliente precisa abrir ticket de suporte para solicitar devolução — não há fluxo formal.

**Backend:**
- Nova entidade `ReturnRequest.java`: `id`, `orderId`, `userId`, `reason` (enum), `items` (JSON com productId + qty), `status` (REQUESTED/APPROVED/REJECTED/COMPLETED), `createdAt`
- `ReturnController` (`POST /api/returns` — autenticado; `GET /api/returns/my` — autenticado)
- `AdminReturnController` (`GET /api/admin/returns`, `PATCH /api/admin/returns/{id}/status`)
- Regra: só permitir solicitação se pedido está `DELIVERED` e `createdAt < 30 dias`

**Frontend — `MinhaConta.jsx`:**
- Na seção de detalhes do pedido (`renderOrderDetail`): botão "Solicitar Devolução" se elegível
- Modal com motivo (dropdown) + itens a devolver (checkbox por item do pedido)

**Dashboard:**
- Nova página `DevolucoesAdmin.jsx`: lista com status, aprovar/rejeitar, observação

---

## 🟡 Média Prioridade

### M1 · Email Templates HTML

**Problema:** Emails enviados por `EmailService.java` são provavelmente texto simples. Lojas profissionais usam HTML responsivo.

**Backend — `EmailService.java`:**
- Usar Thymeleaf para templates HTML (já vem no Spring Boot)
- Criar `resources/templates/email/order-confirmation.html` e `status-update.html`
- Layout: logo, cores da marca, tabela de itens, botão CTA, rodapé com links
- `application.properties`: `spring.mail.properties.mail.smtp.mime.charset=UTF-8`

---

### M2 · Produtos Recentemente Visualizados

**Problema:** Nenhuma personalização baseada em comportamento do usuário.

**Frontend — puro localStorage:**
- Criar `useRecentlyViewed.js`: ao abrir `ProductDetails.jsx`, salvar `product.id` em `localStorage['recentlyViewed']` (array de até 8 ids, FIFO)
- `Home.jsx`: ler ids, filtrar dos `products` existentes, exibir seção "Vistos recentemente" com `ProductCard`
- `ProductDetails.jsx`: exibir seção "Você também viu" abaixo dos produtos relacionados
- Não requer backend

---

### M4 · Segundo Gateway de Pagamento (Mercado Pago)

**Problema:** Só PagSeguro. Se cair, a loja para de vender.

**Backend:**
- Criar `MercadoPagoService.java` como alternativa a `PaymentService`
- `PaymentController`: parâmetro `?gateway=pagseguro|mercadopago` no `POST /api/payment/checkout`
- Env vars: `MERCADOPAGO_ACCESS_TOKEN`
- Webhook separado em `POST /api/payment/webhook/mercadopago`

**Frontend — `Checkout.jsx`:**
- Step 3: seletor de gateway (radio buttons) antes de confirmar

---

### M5 · PWA / Service Worker

**Problema:** Nenhum suporte offline, sem instalação no celular.

**Frontend:**
- Instalar `vite-plugin-pwa` no `frontend/`
- Configurar `vite.config.js`: manifest com nome, ícone, cor de tema
- `public/manifest.json`: `name`, `short_name`, `icons`, `start_url`, `display: standalone`
- Service worker: cache de assets estáticos (CSS, JS, fontes) via `workbox`
- Não cachear chamadas de API (dados dinâmicos)


### M7 · Variantes de Produto (Cor / Tamanho)

**Problema:** Cada variante (P/M/G, Preto/Branco) é um produto separado — fragmenta o catálogo.

**Escopo:** Mudança significativa no modelo de dados.

**Backend:**
- Nova entidade `ProductVariant.java`: `id`, `productId` (FK), `name` (ex: "P / Preto"), `sku`, `price` (nullable, herda do pai se null), `qnt`, `attributes` (JSON: `{"size":"P","color":"Preto"}`)
- `ProductCategory.java`: adicionar `List<ProductVariant> variants`
- `ProductCategoryResponse.java`: incluir variantes no response
- Estoque controlado por variante, não pelo produto pai

**Frontend — `ProductDetails.jsx`:**
- Seletores de atributo (botões de cor, dropdown de tamanho) antes do botão de compra
- Ao selecionar variante: atualizar preço, estoque e imagem exibida

**Dashboard — `GestaoProdutos.jsx`:**
- Modal de edição: aba "Variantes" com CRUD de variantes

---

## 🔵 Diferencial Competitivo

### D1 · Nota Fiscal (NF-e)

Integração com NFe.io ou Focus NFe. Emitir NF-e após pedido `PAID`. Env vars: `NFE_API_KEY`, `NFE_COMPANY_ID`. Endpoint admin para reemitir. Link de download na `MinhaConta.jsx`.

---

### D2 · Google Analytics 4 + Meta Pixel

`frontend/index.html`: adicionar scripts de GA4 (`G-XXXXXXXX`) e Meta Pixel. Eventos: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`. Não disparar se cookie de analytics negado (integrar com `CookieBanner.jsx`).

---

### D3 · Notificações Push (Web Push API)

Service worker necessário (M5 primeiro). Backend: salvar `PushSubscription` por usuário. Disparar push ao mudar status do pedido e quando produto favorito volta ao estoque.

---

### D4 · Checkout B2B (CNPJ)

Campo de CNPJ no checkout (Step 1). Validação de CNPJ (algoritmo de dígito verificador). Campo de Inscrição Estadual. Emitir NF-e com dados da empresa (D1 necessário).

---

### D5 · Carrinho Compartilhável

`POST /api/cart/share` → salva snapshot do carrinho no banco com token UUID → retorna URL `/carrinho/:token`. `GET /api/cart/:token` → retorna itens. Frontend: botão "Compartilhar carrinho" no `CartDrawer.jsx`.

---

## Referência rápida de arquivos

| Domínio | Backend | Frontend/Dashboard |
|---|---|---|
| Produtos | `ProductCategory.java`, `ProductService`, `ProductCategoryController` | `GestaoProdutos.jsx`, `ProductCard.jsx`, `ProductDetails.jsx` |
| Pedidos | `Order.java`, `OrderService`, `OrderController` | `GestaoPedidos.jsx`, `MinhaConta.jsx` (seção orders) |
| Pagamento | `PaymentService`, `PaymentController` | `Checkout.jsx`, `checkoutApi.js` |
| Auth | `User.java`, `AuthService`, `AuthController`, `SecurityConfig` | `AuthProvider.jsx`, `useAuth.js`, `authApi.js` |
| Frete | `FreightService`, `FreightController` | `Checkout.jsx` (step 2), `freightApi.js` |
| Categorias | `Category.java`, `CategoryController`, `AdminCategoryController` | `CategoriasAdmin.jsx`, `categoriesApi.js` |
| Cupons | `Coupon.java`, `CouponService`, `CouponController`, `AdminCouponController` | `CuponsAdmin.jsx`, `Checkout.jsx` (step 1) |
| Reviews | `Review.java`, `ReviewService`, `ReviewController` | `ProductDetails.jsx` (seção reviews), `ReviewsAdmin.jsx` |
| Favoritos | `Favorite.java`, `FavoriteService`, `FavoriteController` | `FavoritesProvider.jsx`, `Favoritos.jsx` |
| Suporte | `Ticket.java`, `TicketService`, `TicketController` | `MinhaConta.jsx` (seção support), `TicketsAdmin.jsx` |
| SEO | — | `useSEO.js`, `index.html`, `robots.txt`, `sitemap.xml` |
| Email | `EmailService.java` | — |
| Imagens | `ProductCategory.java` campo `image`/`images` (TEXT base64 → migrar para CDN) | `GestaoProdutos.jsx` (upload via canvas compressImage) |

---

## Variáveis de ambiente necessárias

| Variável | Onde | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | frontend/.env | URL do backend |
| `VITE_GOOGLE_CLIENT_ID` | frontend/.env | Login Google |
| `VITE_RECAPTCHA_SITE_KEY` | frontend/.env | reCAPTCHA no cadastro |
| `PAGSEGURO_TOKEN` | backend | Pagamentos |
| `PAGSEGURO_WEBHOOK_SECRET` | backend | Verificação HMAC webhook |
| `MELHOR_ENVIO_TOKEN` | backend | Cálculo de frete + rastreio |
| `MELHOR_ENVIO_API_URL` | backend | sandbox ou produção |
| `MELHOR_ENVIO_ORIGIN_ZIP` | backend | CEP de origem dos envios |
| `SPRING_MAIL_*` | backend | Envio de emails |
| `APP_MASTER_EMAIL` | backend | Seed do usuário MASTER |
| `APP_MASTER_PASSWORD` | backend | Seed do usuário MASTER |
| `CLOUDINARY_URL` | backend | Upload de imagens (C1) |
| `MERCADOPAGO_ACCESS_TOKEN` | backend | Segundo gateway (M4) |
| `NFE_API_KEY` / `NFE_COMPANY_ID` | backend | Emissão de NF-e (D1) |
