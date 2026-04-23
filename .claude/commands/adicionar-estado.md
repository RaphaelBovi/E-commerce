Adicione gerenciamento de estado ao componente/página: $ARGUMENTS

## O que fazer

Leia o arquivo mencionado e adicione o estado necessário seguindo os padrões do projeto.

## Padrões de estado

### Loading + dados + erro (padrão de fetch)
```jsx
const [dados, setDados] = useState([]);
const [loading, setLoading] = useState(true);
const [erro, setErro] = useState("");

useEffect(() => {
  let cancelado = false;
  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const resultado = await fetchDados();
      if (!cancelado) setDados(resultado);
    } catch (err) {
      if (!cancelado) setErro(err?.message || "Erro ao carregar.");
    } finally {
      if (!cancelado) setLoading(false);
    }
  }
  carregar();
  return () => { cancelado = true; };
}, [dependencia]);
```

### Estado de formulário
```jsx
const [campo, setCampo] = useState("");
const [submitting, setSubmitting] = useState(false);
const [erro, setErro] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();
  setErro("");
  setSubmitting(true);
  try {
    await acao(campo);
  } catch (err) {
    setErro(err?.message || "Erro ao enviar.");
  } finally {
    setSubmitting(false);
  }
};
```

### Toggle / abertura
```jsx
const [aberto, setAberto] = useState(false);
const toggle = () => setAberto((v) => !v);
```

### Paginação
```jsx
const [pagina, setPagina] = useState(1);
const [total, setTotal] = useState(0);
const POR_PAGINA = 12;
```

## UI de estado (CSS consistente)

**Loading skeleton:**
```jsx
{loading && <div className="nome-skeleton" aria-hidden="true" />}
```
```css
.nome-skeleton {
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
  border-radius: var(--radius);
  height: 200px;
}
@keyframes skeleton-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
```

**Mensagem de erro:**
```jsx
{erro && <div className="nome-erro" role="alert">{erro}</div>}
```
```css
.nome-erro {
  background: var(--danger-soft);
  color: var(--danger);
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}
```

**Estado vazio:**
```jsx
{!loading && dados.length === 0 && (
  <div className="nome-vazio">
    <FaInbox />
    <p>Nenhum item encontrado.</p>
  </div>
)}
```

Adicione o estado necessário ao componente sem alterar a lógica existente que já funciona.
