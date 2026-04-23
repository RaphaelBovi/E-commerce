Crie uma nova página React completa para o e-commerce com o nome: $ARGUMENTS

## O que criar

1. `frontend/src/pages/<NomePagina>.jsx`
2. `frontend/src/pages/<NomePagina>.css`

## Regras obrigatórias

**JSX:**
- `export default function NomePagina({ onAddToCart, products, isLoadingProducts, productsError })`
- Estrutura: `<main className="nome-main"> > <div className="container nome-container"> > seções`
- Helpers puros antes do componente
- Imports: React hooks necessários, Link do react-router-dom, ícones do react-icons/fa, CSS por último
- Comentários HTML `{/* ── Nome da seção ── */}` separando cada bloco

**CSS:**
- SEMPRE usar variáveis do design system: `var(--primary)`, `var(--accent)`, `var(--surface)`, `var(--border)`, `var(--radius)`, `var(--shadow-md)`, `var(--transition)`, etc.
- NUNCA usar valores hardcoded de cor ou shadow
- Nomenclatura: `.nome-main`, `.nome-container`, `.nome-<elemento>`
- Separadores de seção: `/* ─── Nome ─────────── */`
- Hover: shadow maior + `translateY(-2px)` + `transition: var(--transition)`
- Responsive com media queries para 1024px, 768px, 480px

**Identidade visual consistente:**
- Hero/destaque: fundo `var(--primary-soft)`, border-left 3px `var(--accent)`, heading com `letter-spacing: -0.025em`
- Section headers: `::before { width: 3px; background: var(--accent) }` (barra lateral laranja)
- Cards: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`, `box-shadow: var(--shadow-sm)`
- CTAs primários: `background: var(--accent)`, texto branco
- CTAs secundários: `border: 1px solid var(--border)`, `background: var(--surface)`
- Trust/benefícios: ícones em `var(--primary)`, fundo `var(--surface-2)`

## Depois de criar os arquivos

Informe onde registrar a rota em `App.jsx` com o import e a `<Route>` correta.
