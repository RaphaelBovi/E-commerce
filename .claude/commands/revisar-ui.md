Revise a consistência visual e identidade da página/componente: $ARGUMENTS

## O que verificar e corrigir

### 1. Tokens de design
- Há valores hardcoded de cor (hex, rgb) que deveriam ser `var(--cor)`?
- Há `border-radius` numérico que deveria ser `var(--radius-*)`?
- Há `box-shadow` manual que deveria ser `var(--shadow-*)`?
- Há `transition` sem usar `var(--transition)`?
- Há `font-weight` inconsistente com o padrão (headings=700, texto=400/500)?

### 2. Identidade visual
- Section headers têm a barra lateral laranja (`::before` com `var(--accent)`)?
- Cards usam `var(--surface)`, `var(--border)`, `var(--radius)`, `var(--shadow-sm)`?
- Hover dos cards tem shadow crescendo + `translateY(-2px)`?
- CTAs primários usam `var(--accent)` (laranja)?
- CTAs secundários têm `border: 1px solid var(--border)`?
- Ícones decorativos estão em `var(--primary)` (azul)?
- Badges em `var(--accent-soft)` + `var(--accent)` ou `var(--primary-soft)` + `var(--primary)`?
- Mensagens de erro: `var(--danger-soft)` + `var(--danger)`?
- Mensagens de sucesso: `var(--success-soft)` + `var(--success)`?

### 3. Responsividade
- Existem media queries para 1024px, 768px e 480px?
- Em mobile, grids colapsam para 1 coluna?
- Textos grandes diminuem no mobile?
- Padding/margin se adapta no mobile?

### 4. Acessibilidade mínima
- Botões interativos têm `aria-label` quando o texto não é descritivo?
- Focus visible definido (`outline: 2px solid var(--primary)`)?
- Cores de texto têm contraste adequado?
- Imagens têm `alt`?

### 5. Consistência de nomenclatura CSS
- Classes seguem o padrão `nome-pagina-elemento`?
- Sem classes genéricas demais (`.container` interno, `.wrapper` solto)?

## Formato do relatório

Para cada problema encontrado, mostre:
- **Arquivo e linha** onde está
- **O que está errado** (atual)
- **Como corrigir** (código correto)

Depois das correções, aplique-as diretamente nos arquivos.
