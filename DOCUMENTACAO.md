# Documentação do Projeto E-commerce

## Visão Geral

Plataforma de e-commerce fullstack com três camadas:

| Camada | Tecnologia | Porta local |
|---|---|---|
| **Backend** | Spring Boot 3 + Java 21 + PostgreSQL | 8080 |
| **Frontend (loja)** | React 18 + Vite | 5173 |
| **Dashboard (admin)** | React 18 + Vite | 5174 |

---

## Estrutura de Pastas

```
E-commerce/
├── backend/                    ← API REST (Spring Boot)
│   └── src/main/java/com/ecommerce/
│       ├── Auth/               ← Usuários e autenticação
│       │   ├── Controller/     ← Endpoints HTTP (/api/auth, /api/admin)
│       │   ├── Entity/         ← Entidades JPA (User) e DTOs
│       │   ├── Repository/     ← Acesso ao banco (UserRepository)
│       │   └── Service/        ← Lógica de negócio (AuthService, AdminUserService)
│       ├── Config/             ← Configurações do Spring (Security, CORS, Seed)
│       ├── Order/              ← Módulo de pedidos
│       │   ├── Controller/     ← Endpoints HTTP (/api/orders)
│       │   ├── Entity/         ← Order, OrderItem, enums, DTOs
│       │   ├── Repository/     ← OrderRepository
│       │   └── Service/        ← OrderService
│       ├── Product/            ← Módulo de produtos
│       └── Security/           ← Filtro JWT (JwtAuthFilter, JwtUtil)
│
├── frontend/                   ← Loja pública (cliente)
│   └── src/
│       ├── pages/              ← Home, Login, Produto, Carrinho, Checkout, Perfil
│       ├── components/         ← Componentes reutilizáveis (Navbar, Footer)
│       └── services/           ← Chamadas à API do backend
│
└── dashboard/                  ← Painel administrativo
    └── src/
        ├── pages/              ← DashboardHome, Pedidos, Produtos, Notas, Usuários
        ├── components/         ← AdminNavbar, ProtectedRoute
        └── services/           ← apiClient, ordersApi, productsApi
```

---

## Backend — Endpoints da API

### Autenticação (`/api/auth`)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Cadastra novo cliente |
| POST | `/api/auth/login` | Público | Login — retorna token JWT |
| GET | `/api/auth/me` | Autenticado | Dados do usuário logado |

**Campos do cadastro** (RegisterRequest.java):
- `fullName`, `email`, `password`
- `cpf`, `birthDate`, `phone`
- `address`, `city`, `state`, `zipCode`

**Resposta do login** (AuthResponse.java):
```json
{ "token": "eyJ...", "email": "user@email.com", "role": "CUSTOMER" }
```

---

### Pedidos — Cliente (`/api/orders`)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/orders` | Autenticado | Criar pedido |
| GET | `/api/orders/my` | Autenticado | Meus pedidos |
| GET | `/api/orders/my/{id}` | Autenticado | Detalhe de um pedido |
| PATCH | `/api/orders/my/{id}/cancel` | Autenticado | Cancelar pedido |

**Regra de cancelamento**: só permite cancelar se o status for `PENDING_PAYMENT`.

**Corpo para criar pedido** (CreateOrderRequest.java):
```json
{
  "paymentMethod": "PIX",
  "deliveryAddress": "Rua X, 123 - São Paulo/SP",
  "items": [
    {
      "productId": "uuid",
      "productName": "Produto X",
      "productImage": "https://...",
      "unitPrice": 99.90,
      "quantity": 2
    }
  ]
}
```

---

### Pedidos — Admin (`/api/orders`)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/orders` | ADMIN/MASTER | Todos os pedidos |
| GET | `/api/orders/{id}` | ADMIN/MASTER | Qualquer pedido por ID |
| PATCH | `/api/orders/{id}/status` | ADMIN/MASTER | Atualizar status |

**Corpo para atualizar status**:
```json
{ "status": "SHIPPED" }
```

---

### Produtos (`/api/product-category`)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/product-category` | Público | Lista todos os produtos |
| GET | `/api/product-category/ref/{ref}` | Público | Produto por referência |
| POST | `/api/product-category` | ADMIN/MASTER | Criar produto |
| PUT | `/api/product-category/{ref}` | ADMIN/MASTER | Editar produto |
| DELETE | `/api/product-category/ref/{ref}` | ADMIN/MASTER | Excluir produto |

---

### Admin — Usuários (`/api/admin`)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/admin/users` | MASTER | Criar conta ADMIN |
| GET | `/api/admin/users` | MASTER | Listar ADMINs e MASTERs |

---

## Papéis de Usuário (Roles)

| Role | Pode fazer |
|---|---|
| `CUSTOMER` | Comprar, ver os próprios pedidos, cancelar |
| `ADMIN` | Tudo do CUSTOMER + gerenciar produtos e pedidos pelo painel |
| `MASTER` | Tudo do ADMIN + criar/ver contas administrativas |

**Como o role é enviado**: embutido no token JWT. O Spring Security lê o token a cada requisição e sabe o papel do usuário sem consultar o banco.

---

## Autenticação JWT — Como funciona

1. Cliente faz `POST /api/auth/login` com e-mail e senha
2. Backend valida e retorna `{ token, email, role }`
3. Frontend salva o token:
   - Loja: `localStorage` (persiste entre sessões)
   - Dashboard: `sessionStorage` (apaga ao fechar o navegador)
4. Nas próximas requisições, o frontend envia o header:
   ```
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
   ```
5. O filtro `JwtAuthFilter.java` valida o token e libera ou bloqueia o acesso

**Para alterar o tempo de expiração do token**: edite `JwtUtil.java`

---

## Status dos Pedidos

```
PENDING_PAYMENT → PAID → PREPARING → SHIPPED → DELIVERED
                                              ↘ CANCELLED (apenas de PENDING_PAYMENT)
```

| Status | Descrição |
|---|---|
| `PENDING_PAYMENT` | Aguardando pagamento |
| `PAID` | Pagamento confirmado |
| `PREPARING` | Em separação |
| `SHIPPED` | Enviado / em trânsito |
| `DELIVERED` | Entregue |
| `CANCELLED` | Cancelado |

**Para alterar os status disponíveis**: edite `OrderStatus.java`

---

## Métodos de Pagamento

Definidos em `PaymentMethod.java`:
- `PIX`
- `CREDIT_CARD`
- `DEBIT_CARD`
- `BOLETO`

**Para adicionar um novo método**: adicione o valor no enum e atualize o frontend.

---

## Dashboard Admin — Páginas

| Rota | Arquivo | Acesso | Função |
|---|---|---|---|
| `/login` | `LoginAdmin.jsx` | Público | Login do painel |
| `/` | `DashboardHome.jsx` | ADMIN/MASTER | Resumo: métricas, gráfico, pedidos recentes |
| `/pedidos` | `GestaoPedidos.jsx` | ADMIN/MASTER | Lista e gerencia pedidos |
| `/produtos` | `GestaoProdutos.jsx` | ADMIN/MASTER | CRUD de produtos |
| `/notas` | `NotasFiscais.jsx` | ADMIN/MASTER | Notas dos pedidos entregues |
| `/usuarios` | `UsuariosAdmin.jsx` | MASTER | Criar e listar contas admin |

---

## Dashboard Admin — Arquivos de Serviço

### `apiClient.js`
Função central de todas as chamadas HTTP. Adiciona automaticamente o token JWT.

```js
// Exemplo de uso em qualquer página:
import { apiFetch } from "../services/apiClient.js";

const dados = await apiFetch("/minha-rota");                  // GET
await apiFetch("/minha-rota", { method: "POST", body: {...} }); // POST
```

### `ordersApi.js`
```js
getAllOrders()              // GET /api/orders
getOrderById(id)           // GET /api/orders/{id}
updateOrderStatus(id, status) // PATCH /api/orders/{id}/status
```

### `productsApi.js`
```js
fetchProducts()                    // GET  /api/product-category
createProduct(product)             // POST /api/product-category
updateProductByRef(ref, product)   // PUT  /api/product-category/{ref}
deleteProductByRef(ref)            // DELETE /api/product-category/ref/{ref}
```

---

## Variáveis de Ambiente

### Backend (Render / `.env`)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `JWT_SECRET` | Chave secreta para assinar os tokens JWT |
| `APP_MASTER_EMAIL` | E-mail do usuário MASTER criado automaticamente |
| `APP_MASTER_PASSWORD` | Senha do usuário MASTER (mín. 12 chars) |
| `APP_MASTER_FULL_NAME` | Nome do MASTER (opcional, default: "Master Admin") |

### Frontend / Dashboard (`.env` local ou Render)

| Variável | Descrição |
|---|---|
| `VITE_API_BASE_URL` | URL base da API (ex: `https://meu-backend.onrender.com/api`) |

---

## Banco de Dados — Tabelas Principais

### `users`
| Coluna | Tipo | Obrigatório |
|---|---|---|
| id | UUID | Sim |
| email | VARCHAR (único) | Sim |
| password | VARCHAR (hash) | Sim |
| role | VARCHAR (CUSTOMER/ADMIN/MASTER) | Sim |
| full_name | VARCHAR | Sim |
| cpf | CHAR(11) (único) | Não (admin/master) |
| birth_date | DATE | Não |
| phone | VARCHAR(11) | Não |
| address | TEXT | Não |
| city | VARCHAR | Não |
| state | CHAR(2) | Não |
| zip_code | CHAR(8) | Não |
| created_at | TIMESTAMP | Sim |

### `orders`
| Coluna | Tipo |
|---|---|
| id | UUID |
| user_id | UUID (FK → users) |
| status | VARCHAR (enum) |
| payment_method | VARCHAR (enum) |
| total_amount | DECIMAL |
| delivery_address | TEXT |
| tracking_code | VARCHAR (nullable) |
| created_at / updated_at | TIMESTAMP |

### `order_items`
| Coluna | Tipo |
|---|---|
| id | UUID |
| order_id | UUID (FK → orders) |
| product_id | UUID (snapshot) |
| product_name | VARCHAR |
| product_image | TEXT |
| unit_price | DECIMAL |
| quantity | INTEGER |

---

## Como Rodar Localmente

### Backend
```bash
cd backend
# Configure application.properties com DATABASE_URL e JWT_SECRET
./mvnw spring-boot:run
# API disponível em http://localhost:8080
```

### Frontend (loja)
```bash
cd frontend
npm install
# Crie .env com VITE_API_BASE_URL=http://localhost:8080/api
npm run dev
# Disponível em http://localhost:5173
```

### Dashboard (admin)
```bash
cd dashboard
npm install
# Crie .env com VITE_API_BASE_URL=http://localhost:8080/api
npm run dev
# Disponível em http://localhost:5174
```

---

## Pontos de Extensão Comuns

| O que alterar | Onde alterar |
|---|---|
| Adicionar campo ao usuário | `User.java`, `RegisterRequest.java`, `UserProfileResponse.java` |
| Adicionar campo ao produto | Entidade de produto, DTO de produto |
| Adicionar status de pedido | `OrderStatus.java`, frontend (labels nos .jsx) |
| Adicionar método de pagamento | `PaymentMethod.java`, frontend (labels nos .jsx) |
| Mudar regra de cancelamento | `OrderService.cancelOrder()` |
| Mudar tempo de expiração do JWT | `JwtUtil.java` |
| Adicionar novo endpoint | Criar método no `Controller`, lógica no `Service` |
| Proteger novo endpoint | `SecurityConfig.java` — adicionar `.requestMatchers(...)` |
| Adicionar página ao dashboard | Criar `.jsx` em `pages/`, importar no `App.jsx` |
