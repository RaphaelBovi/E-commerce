Crie uma nova seção visual para adicionar em uma página existente do e-commerce: $ARGUMENTS

## O que entregar

1. **Bloco JSX** pronto para colar dentro do `<main>` / `<div className="container">` da página
2. **Bloco CSS** pronto para adicionar no arquivo `.css` da página

## Regras de design

**JSX:**
- Estrutura: `<section className="pagina-nome-secao">` contendo header + conteúdo
- Section header padrão:
  ```jsx
  <div className="section-header">
    <div className="section-header-left">
      <h2>Título da Seção</h2>
      <p className="section-sub">Subtítulo opcional</p>
    </div>
    <Link to="/caminho" className="section-view-all">Ver todos →</Link>
  </div>
  ```
- Ícones: `react-icons/fa`
- Conditional rendering: `{condicao && <JSX />}`

**CSS — identidade visual obrigatória:**
- SEMPRE: `var(--surface)`, `var(--border)`, `var(--radius)`, `var(--shadow-sm/md)`, `var(--transition)`
- Section header `::before`: barra laranja acento
  ```css
  .pagina-secao .section-header-left::before {
    content: "";
    display: block;
    width: 3px;
    height: 1.4em;
    background: var(--accent);
    border-radius: 2px;
    flex-shrink: 0;
  }
  ```
- Heading da seção: `font-weight: 700; letter-spacing: -0.02em; color: var(--text)`
- Cards da seção: `background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm)`
- Hover dos cards: `box-shadow: var(--shadow-lg); transform: translateY(-2px); transition: var(--transition)`
- Ícones decorativos grandes: `background: var(--primary-soft); color: var(--primary); border-radius: var(--radius)`
- Badges: `background: var(--accent-soft); color: var(--accent); font-size: 0.75rem; border-radius: var(--radius-sm)`

**Tipos de seção comuns — escolha conforme $ARGUMENTS:**
- **Hero banner**: gradiente `var(--primary-soft)`, CTA laranja, imagem à direita
- **Trust bar**: grid 3-4 colunas, ícone + título + texto, fundo `var(--surface-2)`
- **Grid de cards**: `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- **Depoimentos**: cards com aspas, nome + avatar inicial colorida
- **FAQ acordeão**: `<details>/<summary>` com chevron animado
- **CTA banner**: fundo `var(--primary)` ou `var(--accent)`, texto branco, botão invertido
- **Comparativo**: tabela ou grid de 2-3 colunas com check/x
- **Timeline**: linha vertical `var(--primary)`, pontos coloridos, cards ao lado
- **Stats**: números grandes `var(--accent)`, label `var(--text-secondary)`
- **Newsletter**: fundo `var(--surface-2)`, campo email + botão, ícone envelope

Inclua media queries para 768px e 480px.
