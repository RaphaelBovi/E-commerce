# Roadmap de Desenvolvimento — E-commerce

> Cada fase deve ser **totalmente concluída e validada** antes de iniciar a próxima.
> Cada item dentro de uma fase deve ser implementado e testado individualmente.

---

## FASE 1 — Crítico (impede operação real da loja)

### 1.1 · Controle de Estoque

**Problema:** `qnt` nunca é decrementado após compra. Produto com `qnt = 0` ainda pode ser adicionado ao carrinho e comprado.

**Backend — `ProductCategory.java`**
- Adicionar método `decrementStock(int qty)` que lança `BusinessException` se `qnt < qty`
- Adicionar método `incrementStock(int qty)` (para cancelamentos)

**Backend — `PaymentService.java`**
- Em `processCheckout()`: antes de criar a cobrança, validar estoque de cada item
- Após status `PAID`/`AUTHORIZED`: chamar `decrementStock` em cada produto do pedido
- Em status `DECLINED`/`CANCELLED`: não alterar estoque (pedido nunca foi confirmado)

**Backend — `OrderService.java`**
- Em `cancelOrder()`: se status anterior era `PAID` ou `PREPARING`, restaurar estoque via `incrementStock`

**Backend — `ProductCategoryResponse.java`**
- Garantir que `qnt` é exposto corretamente (já está)

**Frontend — `ProductCard.jsx`**
- Desabilitar botão "Adicionar ao Carrinho" quando `product.qnt === 0`
- Exibir badge "Esgotado" no lugar do badge de promoção

**Frontend — `ProductDetails.jsx`**
- Desabilitar botão de compra quando `qnt === 0`
- Limitar input de quantidade ao máximo de `product.qnt`
- Exibir aviso visual de estoque baixo quando `qnt <= 3`

**Validação:**
- [ ] Comprar produto → conferir `qnt` decrementou no banco
- [ ] Produto com `qnt = 0` → botão desabilitado no card e na página de detalhes
- [ ] Cancelar pedido PAID → `qnt` restaurado
- [ ] Tentar comprar via API com `qnt = 0` → retorna 400 com mensagem clara

---

### 1.2 · Segurança do Webhook PagSeguro

**Problema:** `POST /api/payment/webhook` aceita qualquer JSON sem verificar autenticidade. Qualquer pessoa pode simular um pagamento aprovado.

**Backend — `PaymentController.java`**
- Adicionar verificação do header `x-pagseguro-signature` (HMAC-SHA256)
- O PagSeguro envia `HMAC-SHA256(raw_body, webhook_secret)`
- Rejeitar com `401` se assinatura ausente ou inválida

**Backend — `application.properties`**
- Nova propriedade: `pagseguro.webhook-secret` (configurar no Render como env var `PAGSEGURO_WEBHOOK_SECRET`)

**Backend — `PaymentService.java`**
- Mover lógica de verificação para `verifyWebhookSignature(String rawBody, String signature)`

**Validação:**
- [ ] POST sem header de assinatura → retorna 401
- [ ] POST com assinatura incorreta → retorna 401
- [ ] POST legítimo do PagSeguro → processa normalmente

---

### 1.3 · Persistência do Carrinho

**Problema:** Carrinho vive apenas em `useState` no `App.jsx`. Recarregar a página ou fechar o browser esvazia o carrinho.

**Frontend — `App.jsx`**
- Inicializar `cartItems` lendo de `localStorage.getItem('ecommerce_cart')`
- A cada mudança em `cartItems`, salvar no `localStorage` via `useEffect`
- Ao fazer logout (`AuthProvider.logout()`), limpar o carrinho do `localStorage`

**Frontend — `AuthProvider.jsx`**
- No `logout()`: além de limpar `localStorage` de auth, chamar callback para limpar o carrinho

**Estratégia:** carrinho anônimo no `localStorage` + ao logar, mesclar com eventuais itens salvos anteriormente (se o usuário estava navegando antes de logar).

**Validação:**
- [ ] Adicionar item ao carrinho → recarregar página → item ainda está lá
- [ ] Fazer logout → badge do carrinho zera
- [ ] Navegar sem estar logado, adicionar ao carrinho, logar → itens permanecem

---

## FASE 2 — Alta Prioridade (experiência e operação)

### 2.1 · Email de Confirmação de Pedido + Código de Rastreio

**Problema:** Cliente finaliza o pedido e não recebe nenhum email. Admin muda status para SHIPPED mas não há campo de código de rastreio.

**Backend — `Order.java`**
- Adicionar campo `String trackingCode` (nullable)
- Adicionar campo `String trackingUrl` (nullable, opcional)

**Backend — `UpdateOrderStatusRequest.java`**
- Adicionar campos opcionais `trackingCode` e `trackingUrl`

**Backend — `OrderService.java`**
- Em `updateStatus()`: se novo status é `SHIPPED`, salvar `trackingCode`/`trackingUrl`

**Backend — `EmailService.java`**
- Novo método `sendOrderConfirmation(Order order)`: email com número do pedido, itens, total, endereço de entrega
- Novo método `sendStatusUpdate(Order order)`: email com novo status + código de rastreio quando `SHIPPED`

**Backend — `PaymentService.java`**
- Após `PAID`: chamar `emailService.sendOrderConfirmation(order)`

**Backend — `OrderService.java`**
- Após `updateStatus()`: chamar `emailService.sendStatusUpdate(order)` se status mudou para `SHIPPED` ou `DELIVERED`

**Dashboard — `GestaoPedidos.jsx`**
- Ao mudar status para SHIPPED: mostrar campos "Código de rastreio" e "URL de rastreio" (opcionais)
- Exibir código de rastreio na linha do pedido quando disponível

**Frontend — `MinhaConta.jsx`**
- Na timeline do pedido: exibir código de rastreio e link quando status `SHIPPED`

**Validação:**
- [ ] Finalizar pedido → email de confirmação chega na caixa de entrada
- [ ] Admin muda para SHIPPED com código → email de "pedido enviado" chega com código
- [ ] Cliente vê o código de rastreio na timeline de Minha Conta

---

### 2.2 · Sistema de Cupons de Desconto

**Problema:** Seção de cupons em MinhaConta marcada como "em breve". Nenhuma lógica de desconto existe.

**Backend — `Coupon.java`** (nova entidade)
- `id`, `code` (único, uppercase), `type` (`PERCENT` | `FIXED`), `value`
- `minOrderAmount`, `maxUsages`, `usageCount`
- `expiresAt`, `active`, `createdAt`

**Backend — `CouponRepository.java`**
- `findByCodeAndActiveTrue(String code)`

**Backend — `CouponService.java`**
- `validateCoupon(String code, BigDecimal orderTotal)` → retorna desconto calculado ou lança `BusinessException`
- `applyCoupon(String code)` → incrementa `usageCount`

**Backend — `AdminCouponController.java`** (`/api/admin/coupons`, MASTER only)
- `POST /` → criar cupom
- `GET /` → listar todos
- `PATCH /{id}` → ativar/desativar
- `DELETE /{id}` → remover

**Backend — `CouponController.java`** (`/api/coupons/validate`, autenticado)
- `POST /validate` com body `{ code, orderTotal }` → retorna `{ valid, discount, finalTotal }`

**Backend — `CreateCheckoutSessionRequest.java`**
- Adicionar campo opcional `couponCode`

**Backend — `PaymentService.java`**
- Validar cupom antes de criar a sessão, subtrair desconto do total

**Frontend — `Checkout.jsx`**
- Step 1 (revisão do carrinho): campo de cupom com botão "Aplicar"
- Exibir desconto aplicado no `OrderSummary`

**Dashboard — `UsuariosAdmin.jsx` ou nova página `CuponsAdmin.jsx`**
- Tabela de cupons com ações de ativar/desativar/excluir
- Formulário de criação (código, tipo, valor, validade, usos máximos)

**Validação:**
- [ ] Criar cupom PERCENT 10% → aplicar no checkout → desconto correto calculado
- [ ] Cupom expirado → mensagem de erro adequada
- [ ] Cupom com limite de usos esgotado → bloqueado
- [ ] Pedido criado com cupom → total correto no banco

---

### 2.3 · Reviews e Avaliações de Produto

**Problema:** Nenhum sistema de estrelas ou comentários. Decisão de compra fica comprometida para novos visitantes.

**Backend — `Review.java`** (nova entidade)
- `id`, `@ManyToOne User user`, `@ManyToOne ProductCategory product`
- `rating` (1–5, `@Min(1) @Max(5)`), `comment` (nullable, max 1000 chars)
- `createdAt`
- Constraint única: um usuário → uma avaliação por produto

**Backend — `ReviewRepository.java`**
- `findByProductIdOrderByCreatedAtDesc(UUID productId)`
- `existsByUserIdAndProductId(UUID userId, UUID productId)`
- `findAverageRatingByProductId(UUID productId)` → `@Query` com `AVG`

**Backend — `ReviewController.java`** (`/api/reviews`)
- `GET /{productId}` → lista de reviews (público)
- `GET /{productId}/summary` → `{ average, total, distribution }` (público)
- `POST /{productId}` → criar review (autenticado, só quem comprou o produto)
- `DELETE /{id}` → remover própria review (autenticado)

**Backend — `AdminReviewController.java`** (`/api/admin/reviews`)
- `GET /` → todas as reviews com filtro por produto/rating
- `DELETE /{id}` → moderar review inadequada

**Regra de negócio:** Apenas usuários que têm pedido `DELIVERED` contendo o produto podem avaliar.

**Frontend — `ProductDetails.jsx`**
- Seção de avaliações abaixo das informações do produto
- Exibir média com estrelas + total de avaliações
- Distribuição por estrela (barra de progresso)
- Lista das reviews (avatar com iniciais, nome, data, estrelas, comentário)
- Formulário de avaliação (visível apenas para quem comprou e ainda não avaliou)

**Frontend — `ProductCard.jsx`**
- Exibir média de estrelas e total de avaliações abaixo do nome do produto

**Dashboard — nova aba ou página `ReviewsAdmin.jsx`**
- Listar todas as reviews com opção de exclusão

**Validação:**
- [ ] Comprar produto → pedido entregue → formulário de review aparece
- [ ] Avaliar → média atualiza na página do produto e no card
- [ ] Tentar avaliar sem ter comprado → bloqueado (403)
- [ ] Admin exclui review → some da lista

---

### 2.4 · Paginação e Filtros no Admin (Pedidos e Produtos)

**Problema:** `getAllOrders()` carrega todos os pedidos de uma vez. Com volume real, a página trará lentidão severa.

**Backend — `OrderRepository.java`**
- Mudar `List<Order>` para `Page<Order>` nos métodos admin
- Adicionar: `findAllByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable)`
- Adicionar: `findByUserEmailContainingIgnoreCase(String email, Pageable pageable)`

**Backend — `OrderController.java`**
- `GET /api/orders/admin` → aceitar query params: `page`, `size`, `status`, `email`, `dateFrom`, `dateTo`
- Retornar `Page<OrderResponse>` com metadados: `totalElements`, `totalPages`, `currentPage`

**Backend — `ProductCategoryRepository.java`**
- Adicionar `findAll(Pageable pageable)` e `findByNameContainingIgnoreCase(String name, Pageable pageable)`

**Backend — `ProductCategoryController.java`**
- `GET /api/product-category` → adicionar paginação e busca por nome para o admin (manter endpoint público atual sem paginação para o frontend da loja)

**Dashboard — `GestaoPedidos.jsx`**
- Substituir lista completa por tabela paginada
- Adicionar filtros: status (dropdown), e-mail do cliente (texto), período (data início/fim)
- Paginação com botões Anterior/Próximo e indicador "Página X de Y (Z resultados)"

**Dashboard — `GestaoProdutos.jsx`**
- Adicionar busca por nome
- Paginação se o catálogo for grande

**Validação:**
- [ ] Admin com 100+ pedidos: página carrega em < 1s
- [ ] Filtrar por status PAID → só pedidos PAID aparecem
- [ ] Buscar por email → filtra corretamente
- [ ] Navegar entre páginas → funciona sem resetar filtros

---

## FASE 3 — Média Prioridade (profissionalização)

### 3.1 · SEO — Meta Tags Dinâmicas

**Problema:** Todas as páginas têm o mesmo `<title>`. Produto compartilhado no WhatsApp não mostra imagem. Zero visibilidade orgânica.

**Frontend — `index.html`**
- Estrutura base com placeholders para Open Graph e Twitter Card

**Frontend — novo hook `useSEO({ title, description, image, url })`**
- Usa `document.title` e manipula `<meta>` via `querySelector`

**Páginas a configurar:**
- `Home.jsx`: título da loja, descrição geral
- `Catalog.jsx`: "Catálogo — [filtro ativo se houver]"
- `ProductDetails.jsx`: nome do produto, descrição truncada, primeira imagem
- `Lancamentos.jsx`, `Promocoes.jsx`: títulos específicos
- `Login.jsx`, `Checkout.jsx`: `noindex` (não indexar no Google)

**Adicionar ao projeto:**
- `public/robots.txt` (permitir Google, bloquear `/checkout`, `/minha-conta`)
- `public/sitemap.xml` estático ou gerado via script

**Validação:**
- [ ] Compartilhar link de produto no WhatsApp → mostra imagem e nome
- [ ] `<title>` muda ao navegar entre páginas
- [ ] Google Search Console não reporta erros de meta tags

---

### 3.2 · LGPD — Conformidade Legal

**Problema:** Loja coleta nome, CPF, endereço, email sem aviso formal. Exigência legal no Brasil (Lei 13.709/2018).

**Frontend — `CookieBanner.jsx`** (novo componente)
- Banner fixo no rodapé da primeira visita
- Botões: "Aceitar todos" e "Ver política"
- Salva consentimento em `localStorage`
- Não renderiza se consentimento já foi dado

**Frontend — nova página `PoliticaPrivacidade.jsx`**
- Quais dados são coletados e por quê
- Com quem são compartilhados (PagSeguro, Google)
- Como exercer direitos (exclusão de conta, portabilidade)
- Contato do DPO (encarregado de dados)

**Frontend — nova página `TermosDeUso.jsx`**
- Condições de uso da plataforma
- Política de trocas e devoluções
- Limitações de responsabilidade

**Frontend — `Footer.jsx`**
- Adicionar links para ambas as páginas

**Backend — `AuthController.java`**
- Endpoint `DELETE /api/auth/me` para exclusão de conta (direito ao esquecimento da LGPD)

**Validação:**
- [ ] Primeira visita → banner aparece
- [ ] Segunda visita → banner não aparece
- [ ] Links no footer levam às páginas corretas
- [ ] Endpoint de exclusão de conta funciona e remove dados do banco

---

### 3.3 · Cálculo de Frete Real

**Problema:** Frete hardcoded como R$ 0,00 no PagSeguro. Loja não consegue operar com margens reais sem saber o custo de envio.

**Integração recomendada: Melhor Envio** (API REST simples, suporta Correios + transportadoras)

**Backend — `FreightService.java`** (novo)
- `calculateFreight(String originZip, String destZip, List<FreightItem> items)` → lista de opções
- `FreightItem`: peso, largura, altura, comprimento, quantidade
- Retorna: `List<FreightOption>` com `{ carrier, service, price, deliveryDays }`
- Fallback: tabela simples por estado se API indisponível

**Backend — `FreightController.java`** (`/api/freight/calculate`, público)
- `POST /calculate` com `{ zipCode, items: [{ productId, quantity }] }`
- Busca dimensões dos produtos no banco (adicionar campos ao `ProductCategory`)

**Backend — `ProductCategory.java`**
- Adicionar: `weightKg` (BigDecimal), `widthCm`, `heightCm`, `lengthCm` (Integer)

**Backend — `ProductCategoryRequest.java` / `Response`**
- Expor os novos campos de dimensão

**Dashboard — `GestaoProdutos.jsx`**
- Adicionar campos de dimensão/peso no formulário de criação/edição de produto

**Frontend — `Checkout.jsx`** (Step 2 — Entrega)
- Após preenchimento do CEP: botão "Calcular frete"
- Exibir opções de frete com transportadora, prazo e preço
- Seleção de opção de frete inclui o valor no total do `OrderSummary`

**Frontend — `Checkout.jsx`** (Step 3 — Pagamento)
- Total inclui frete selecionado

**Validação:**
- [ ] Preencher CEP e calcular → pelo menos 1 opção retornada
- [ ] Selecionar frete → valor soma no total
- [ ] Produto sem dimensões cadastradas → frete calculado com dimensões padrão (fallback)

---

### 3.4 · Gestão de Categorias no Dashboard

**Problema:** Campo `category` é string livre (`"eletronicos"`, `"Eletrônicos"`, `"eletronico"` são tratados como categorias diferentes). Filtro do catálogo fica inconsistente.

**Backend — `Category.java`** (nova entidade, separada de `ProductCategory`)
- `id` (UUID), `name` (ex: "Eletrônicos"), `slug` (ex: "eletronicos"), `active`, `createdAt`
- `slug` gerado automaticamente do `name` (lowercase, sem acentos, `-` no lugar de espaços)

**Backend — `CategoryRepository.java`**
- `findByActiveTrue()`, `findBySlug(String slug)`

**Backend — `CategoryController.java`** (público: `GET /api/categories`)
- `GET /` → lista de categorias ativas (para populas o filtro do catálogo)

**Backend — `AdminCategoryController.java`** (`/api/admin/categories`, ADMIN+MASTER)
- CRUD completo

**Backend — `ProductCategory.java`**
- Manter campo `String category` por compatibilidade, mas validar contra slugs existentes no `ProductService`

**Dashboard — nova página `CategoriasAdmin.jsx`**
- Lista de categorias com toggle ativo/inativo
- Formulário de criação/edição

**Dashboard — `GestaoProdutos.jsx`**
- Campo de categoria vira um `<select>` populado pela API de categorias

**Frontend — `Catalog.jsx`**
- Filtro de categoria populado pela API (em vez de extraído dos produtos)

**Validação:**
- [ ] Criar categoria "Ferramentas" → aparece no select do form de produto
- [ ] Criar produto com essa categoria → aparece no filtro do catálogo
- [ ] Desativar categoria → some do filtro e do select

---

## FASE 4 — Baixa Prioridade (refinamento de UX)

### 4.1 · Toast Notifications

**Biblioteca:** `react-hot-toast` (leve, sem dependências, customizável)

**Substituir:**
- Alerts de "Adicionado ao carrinho" por toast de sucesso
- Erros de formulário que hoje aparecem em `<div className="alert">` por toasts de erro
- Confirmação de cupom aplicado
- Feedback de favorito adicionado/removido

**Validação:**
- [ ] Adicionar produto ao carrinho → toast aparece e some após 3s
- [ ] Erro de login → toast vermelho com mensagem
- [ ] Favoritar → toast discreto no canto

---

### 4.2 · Breadcrumb de Navegação

**Componente:** `Breadcrumb.jsx` genérico que recebe `[{ label, href }]`

**Usar em:**
- `Catalog.jsx`: Home > Catálogo > [Categoria se filtrada]
- `ProductDetails.jsx`: Home > Catálogo > [Categoria] > [Nome do produto]
- `Lancamentos.jsx`: Home > Novidades
- `Promocoes.jsx`: Home > Promoções
- `MinhaConta.jsx`: Home > Minha Conta > [Seção ativa]

**Validação:**
- [ ] Breadcrumb renderiza corretamente em cada página
- [ ] Links são clicáveis e navegam corretamente
- [ ] Último item (página atual) não é link

---

### 4.3 · Skeleton Loading em ProductDetails

**Problema:** `ProductDetails.jsx` não tem skeleton enquanto carrega. Página fica em branco ou pisca.

**Frontend — `ProductDetails.jsx`**
- Enquanto `isLoadingProducts` ou produto não encontrado: exibir layout esqueleto
- Skeleton para: imagem principal, galeria de thumbnails, nome, preço, botão, descrição

**Validação:**
- [ ] Abrir `/produto/:id` com conexão lenta → skeleton visível antes do conteúdo
- [ ] Skeleton não causa layout shift após o conteúdo carregar

---

### 4.4 · Página 404 Personalizada

**Problema:** Rota inválida redireciona silenciosamente para `/` em vez de informar o usuário.

**Frontend — nova página `NotFound.jsx`**
- Mensagem amigável ("Página não encontrada")
- Botão para voltar à Home e outro para o Catálogo
- Ícone ilustrativo

**Frontend — `App.jsx`**
- Substituir `<Route path="*" element={<Navigate to="/" />}` por `<NotFound />`

**Validação:**
- [ ] Acessar `/pagina-que-nao-existe` → mostra página 404
- [ ] Botão "Ir para a Home" funciona

---

### 4.5 · Comparação de Produtos

**Contexto:** Útil para e-commerces de eletrônicos, ferramentas ou qualquer produto com specs técnicas comparáveis.

**Frontend — `CompareContext.jsx`** (novo)
- Máximo de 3 produtos na comparação simultânea
- Estado persistido em `localStorage`

**Frontend — `ProductCard.jsx`**
- Botão "Comparar" (visível em hover, abaixo do coração)
- Destaque quando produto já está na lista de comparação

**Frontend — nova página `Comparar.jsx`**
- Tabela lado a lado: nome, imagem, preço, marca, estoque, avaliação média
- Botão "Remover" por produto
- Botão "Adicionar ao Carrinho" por produto

**Frontend — `CompareBar.jsx`** (componente flutuante)
- Barra fixa no rodapé quando há produtos na comparação
- Mostra miniaturas + botão "Comparar agora"

**Validação:**
- [ ] Selecionar 3 produtos → barra de comparação aparece
- [ ] Tentar adicionar 4º produto → bloqueado com aviso
- [ ] Página de comparação exibe specs lado a lado corretamente

---

## Referência Rápida — Arquivos por Fase

| Fase | Arquivos Backend | Arquivos Frontend/Dashboard |
|---|---|---|
| 1.1 Estoque | `ProductCategory.java`, `PaymentService.java`, `OrderService.java` | `ProductCard.jsx`, `ProductDetails.jsx` |
| 1.2 Webhook | `PaymentController.java`, `PaymentService.java` | — |
| 1.3 Carrinho | — | `App.jsx`, `AuthProvider.jsx` |
| 2.1 Email/Rastreio | `Order.java`, `OrderService.java`, `EmailService.java` | `GestaoPedidos.jsx`, `MinhaConta.jsx` |
| 2.2 Cupons | `Coupon.java`, `CouponService.java`, `CouponController.java` | `Checkout.jsx`, novo `CuponsAdmin.jsx` |
| 2.3 Reviews | `Review.java`, `ReviewController.java` | `ProductDetails.jsx`, `ProductCard.jsx` |
| 2.4 Paginação | `OrderRepository.java`, `OrderController.java` | `GestaoPedidos.jsx`, `GestaoProdutos.jsx` |
| 3.1 SEO | — | `useSEO.js`, todas as páginas, `robots.txt` |
| 3.2 LGPD | `AuthController.java` (delete) | `CookieBanner.jsx`, `PoliticaPrivacidade.jsx`, `TermosDeUso.jsx` |
| 3.3 Frete | `FreightService.java`, `ProductCategory.java` | `Checkout.jsx`, `GestaoProdutos.jsx` |
| 3.4 Categorias | `Category.java`, `CategoryController.java` | `CategoriasAdmin.jsx`, `GestaoProdutos.jsx` |
| 4.1 Toasts | — | `App.jsx` + todos os forms |
| 4.2 Breadcrumb | — | `Breadcrumb.jsx`, pages |
| 4.3 Skeleton | — | `ProductDetails.jsx` |
| 4.4 404 | — | `NotFound.jsx`, `App.jsx` |
| 4.5 Comparação | — | `CompareContext.jsx`, `Comparar.jsx`, `CompareBar.jsx` |
