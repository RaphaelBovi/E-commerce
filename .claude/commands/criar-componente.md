Crie um novo componente React reutilizável para o e-commerce com o nome: $ARGUMENTS

## O que criar

1. `frontend/src/components/<NomeComponente>.jsx`
2. `frontend/src/components/<NomeComponente>.css`

## Regras obrigatórias

**JSX:**
- `export default function NomeComponente({ prop1, prop2, ... })`
- Props bem definidas no destructuring com valores padrão quando aplicável
- Sem lógica de página — o componente recebe dados e callbacks via props
- Imports: hooks do React, ícones fa de react-icons/fa, CSS por último
- Se tiver estados internos (hover, active, open), usar `useState`

**CSS:**
- SEMPRE usar variáveis: `var(--surface)`, `var(--border)`, `var(--radius)`, `var(--primary)`, `var(--accent)`, `var(--shadow-sm)`, `var(--transition)`, `var(--text)`, `var(--text-secondary)`, etc.
- NUNCA valores hardcoded de cor, shadow ou radius que existam como variável
- Prefixo da classe = nome do componente em kebab: `.nome-componente`, `.nome-componente-header`, `.nome-componente-item`
- Separadores: `/* ─── Seção ─────────────────────────── */`
- Hover com `transition: var(--transition)` e shadow crescente
- Focus: `outline: 2px solid var(--primary); outline-offset: 2px`
- Responsive obrigatório: 768px e 480px

**Identidade visual:**
- Cards internos: `var(--surface)`, `var(--shadow-sm)`, `var(--radius)`
- Ícones decorativos: `color: var(--primary)` ou `color: var(--accent)`
- Badges/tags: fundo `var(--accent-soft)`, texto `var(--accent)` ou `var(--primary-soft)` + `var(--primary)`
- Botão primário interno: `var(--accent)`, branco, hover `var(--accent-hover)`
- Botão secundário: `var(--surface)`, `var(--border)`, `var(--text)`, hover `var(--surface-2)`
- Textos secundários: `var(--text-secondary)`, labels menores: `var(--text-muted)`
- Separadores: `border-top: 1px solid var(--border)`

## Exemplo de export e uso

Ao finalizar, mostre como importar e usar o componente em uma página:
```jsx
import NomeComponente from "../components/NomeComponente";
<NomeComponente prop1={valor1} prop2={valor2} />
```
