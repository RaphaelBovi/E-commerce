# E-commerce — Guia de Convenções

## Stack

- **React 19** + **Vite 7** — sem TypeScript, JSX puro
- **React Router v7** — roteamento declarativo
- **CSS puro** — sem Tailwind, sem UI kit externo
- **react-icons/fa** — ícones (prefixo `Fa`)
- **fetch API** — HTTP (axios importado mas não usado)
- **@react-oauth/google** — login Google
- **react-google-recaptcha** — reCAPTCHA v2 checkbox

## Estrutura de pastas

```
frontend/src/
  components/   # Componentes reutilizáveis (PascalCase.jsx + PascalCase.css)
  pages/        # Páginas/rotas (PascalCase.jsx + PascalCase.css)
  context/      # Estado global: auth-context.js, AuthProvider.jsx, useAuth.js
  services/     # Chamadas HTTP: productsApi.js, authApi.js, checkoutApi.js, ordersApi.js
  data/         # Fallbacks locais (mockData.js)
  assets/       # Imagens estáticas
  index.css     # Tokens de design + reset + utilitários globais
  App.jsx       # Roteamento + layout raiz
```

## Tokens de design (index.css)

### Cores
```css
/* Superfícies */
--page-bg: #F7F7F8        /* fundo de página */
--surface: #FFFFFF         /* cards */
--surface-2: #F4F4F6       /* hover / fundo secundário */
--surface-3: #ECECEE

/* Bordas */
--border: #E4E4E7
--border-strong: #D1D1D6

/* Texto */
--text: #0C0C0E            /* principal */
--text-secondary: #52525B
--text-muted: #A1A1AA

/* Primária — azul (confiança, links) */
--primary: #2563EB
--primary-hover: #1D4ED8
--primary-soft: #EFF6FF
--primary-soft-border: #BFDBFE

/* Acento — laranja (CTAs, conversão) */
--accent: #F97316
--accent-hover: #EA6C0A
--accent-soft: #FFF7ED

/* Semânticas */
--success: #16A34A   --success-soft: #F0FDF4
--warning: #D97706   --warning-soft: #FFFBEB
--danger:  #DC2626   --danger-soft:  #FEF2F2
```

### Sombras
```css
--shadow-xs  --shadow-sm  --shadow-md  --shadow-lg  --shadow-xl
```

### Raios de borda
```css
--radius-xs: 4px   --radius-sm: 8px   --radius: 12px
--radius-lg: 16px  --radius-xl: 20px
```

### Espaçamento e layout
```css
--navbar-h: 137px            /* altura total da navbar */
.container                   /* max-width 1320px, padding 0 1.5rem */
.responsive-grid             /* 2→3→4→5 cols */
```

### Transições
```css
--transition-fast: 0.15s ease   /* hover imediato */
--transition: 0.2s ease         /* padrão */
--transition-slow: 0.3s ease    /* animações de card */
```

### Tipografia
- Fonte: `"Plus Jakarta Sans"`, system-ui, sans-serif
- Base: 15px
- Headings: `font-weight: 700`, `letter-spacing: -0.025em`

## Estrutura de página (template)

```jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaIcon } from "react-icons/fa";
import ComponenteX from "../components/ComponenteX";
import "./NomePagina.css";

// helpers puros antes do componente
function helper() { ... }

export default function NomePagina({ onAddToCart, products, isLoadingProducts }) {
  // 1. state
  const [valor, setValor] = useState(null);

  // 2. effects
  useEffect(() => { ... }, []);

  // 3. handlers
  const handleAcao = () => { ... };

  // 4. JSX
  return (
    <main className="nome-main">
      <div className="container nome-container">
        {/* ── Seção ── */}
        <section className="nome-secao">
          ...
        </section>
      </div>
    </main>
  );
}
```

## Estrutura de CSS de página

```css
/* ─── Layout ─────────────────────────────────── */
.nome-main { flex: 1; background: var(--page-bg); }
.nome-container { padding: 2rem 1.5rem 4rem; }

/* ─── Hero / seção principal ─────────────────── */
.nome-hero { ... }

/* ─── Elementos ──────────────────────────────── */
.nome-card { ... }
.nome-card:hover { ... }

/* ─── Responsive ─────────────────────────────── */
@media (max-width: 1024px) { ... }
@media (max-width: 768px) { ... }
@media (max-width: 480px) { ... }
```

## Regras de CSS

- **Sempre** usar variáveis CSS (`var(--primary)`, `var(--radius)`, etc.)
- **Nunca** usar valores hardcoded de cor, shadow ou radius que já existam como variável
- Hover: aumentar shadow (`--shadow-sm` → `--shadow-lg`) + `translateY(-2px)`
- Ativo/pressed: `scale(0.97)` ou `translateY(0)`
- Foco: `outline: 2px solid var(--primary); outline-offset: 2px`
- Mobile-first nos media queries

## Identidade visual por seção

| Seção | Estilo |
|---|---|
| Hero / destaque | Gradiente com `--primary-soft`, border-left `--accent`, heading grande |
| Cards de produto | `--surface`, `--shadow-sm`, `--radius`, hover `--shadow-lg` |
| CTA primário (comprar) | `background: var(--accent)`, texto branco, `--radius-sm` |
| CTA secundário (ver mais) | `border: 1px solid var(--border)`, `--surface`, `--text` |
| Badges (novo, oferta) | `--accent-soft` + `--accent` ou `--primary-soft` + `--primary` |
| Trust bar (garantias) | ícone `--primary`, texto `--text-secondary`, fundo `--surface-2` |
| Section header | `::before` com `background: var(--accent)` (barra lateral laranja) |
| Mensagens de erro | `--danger-soft` + `--danger`, `--radius-sm` |
| Mensagens de sucesso | `--success-soft` + `--success` |

## Componentes disponíveis

- `<ProductCard product={} onAddToCart={} />` — card de produto
- `<AutoCarousel items={} renderItem={} />` — carrossel automático
- `<CartDrawer isOpen={} onClose={} cartItems={} />` — drawer do carrinho
- `<Navbar />` — barra de navegação (fixa, altura `--navbar-h`)
- `<Footer />` — rodapé
- `<WhatsAppButton />` — botão flutuante

## Auth

```js
const { user, login, logout, isAuthenticated } = useAuth();
// user = { token, email, role } | null
// role = "CUSTOMER" | "ADMIN" | "MASTER"
```

Páginas protegidas: redirecionar para `/login` se `!isAuthenticated`.

## Serviços (API)

```js
import { fetchProducts } from "../services/productsApi";
import { getAuthHeader, loadStoredSession } from "../services/authApi";
import { createCheckoutSession } from "../services/checkoutApi";
import { fetchOrders } from "../services/ordersApi";
```

API base: `VITE_API_BASE_URL` (fallback `http://localhost:8080/api`)

## Nomenclatura

| Tipo | Convenção |
|---|---|
| Componentes/Páginas | `PascalCase.jsx` + `PascalCase.css` |
| Serviços/utilitários | `camelCase.js` |
| Classes CSS | `kebab-case`, prefixadas com nome do componente |
| Constantes | `UPPER_SNAKE_CASE` |
| Hooks | prefixo `use` |
| Handlers | prefixo `handle` |
| Booleans | prefixo `is` / `has` / `can` |

## Breakpoints

```
480px   — mobile pequeno
768px   — tablet / mobile grande
1024px  — desktop pequeno
1440px  — desktop grande
```

## Skills disponíveis

| Comando | Uso |
|---|---|
| `/criar-pagina` | Cria JSX + CSS completos de uma nova página |
| `/criar-componente` | Cria JSX + CSS de um componente reutilizável |
| `/criar-secao` | Cria uma seção para adicionar em página existente |
| `/criar-servico` | Cria funções de API para um novo endpoint |
| `/revisar-ui` | Revisa consistência visual de uma página |
| `/adicionar-estado` | Adiciona gerenciamento de estado a um componente |
