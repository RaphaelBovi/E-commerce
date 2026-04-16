// ─────────────────────────────────────────────────────────────────
// GestaoProdutos.jsx — Página de gestão do catálogo de produtos
//
// Funcionalidades:
//   - Listar todos os produtos com imagem, referência, nome, marca,
//     categoria, preço, estoque e status
//   - Filtrar por texto (nome, ref, marca), categoria e disponibilidade
//   - Criar novo produto via modal com formulário validado
//   - Editar produto existente (a referência não pode ser alterada)
//   - Excluir produto com confirmação
//   - Upload de imagem local (base64) ou URL externa
//   - Badge de status automático baseado em estoque, categoria e preço
//
// A comunicação com a API é feita pelos serviços em productsApi.js.
//
// Para adicionar uma nova categoria:
//   1. Inclua a string no array CATEGORIES
//   2. Ela aparecerá automaticamente nos filtros e no formulário
//
// Para adicionar um novo campo ao produto:
//   1. Inclua o campo em EMPTY_FORM
//   2. Adicione o campo no formulário do modal
//   3. Inclua o campo no objeto payload enviado à API
// ─────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState, useRef } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSyncAlt, FaTimes } from "react-icons/fa";
import {
  fetchProducts,
  createProduct,
  updateProductByRef,
  deleteProductByRef,
} from "../services/productsApi.js";
import "./GestaoProdutos.css";

// Categorias disponíveis no sistema.
// Para adicionar uma nova categoria, inclua a string aqui.
const CATEGORIES = ["mais-vendidos", "novidades", "geral"];

// Formulário vazio usado como estado inicial ao abrir o modal de criação.
// Também usado para limpar o formulário após criar/cancelar.
const EMPTY_FORM = { name: "", ref: "", price: "", qnt: "", marca: "", category: "geral", image: "" };

// Componente de badge de status para cada produto.
// A lógica de prioridade é: sem estoque > lançamento > promoção > ativo.
// Para alterar as regras de classificação, edite os if/else abaixo.
function StatusBadge({ product }) {
  if (product.qnt === 0) return <span className="badge badge-cancelled">Sem Estoque</span>;
  if (product.category === "novidades") return <span className="badge badge-shipped">Lançamento</span>;
  if (Number(product.price) <= 2000) return <span className="badge badge-pending">Promoção</span>;
  return <span className="badge badge-paid">Ativo</span>;
}

// Formata um número como moeda brasileira (R$).
// Exemplo: 1500 → "R$ 1.500,00"
function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GestaoProdutos() {
  // Lista completa de produtos carregados da API
  const [products, setProducts]   = useState([]);

  // Indica se a lista está sendo carregada (exibe spinner)
  const [loading, setLoading]     = useState(true);

  // Mensagem de erro geral da página (ex: falha ao carregar ou excluir)
  const [error, setError]         = useState("");

  // Mensagem de sucesso temporária (desaparece após 3 segundos)
  const [success, setSuccess]     = useState("");

  // Texto digitado na barra de busca (filtra por nome, ref ou marca)
  const [search, setSearch]       = useState("");

  // Filtro de categoria selecionado ("all" = todas as categorias)
  const [catFilter, setCat]       = useState("all");

  // Filtro de estoque: "all" = todos, "in" = em estoque, "out" = sem estoque
  const [stockFilter, setStock]   = useState("all");

  // Controla a visibilidade do modal de criação/edição
  const [showModal, setShowModal] = useState(false);

  // Referência do produto em edição (null = criando novo; string = ref do produto editado)
  const [editRef, setEditRef]     = useState(null);

  // Dados do formulário do modal (campos do produto)
  const [form, setForm]           = useState(EMPTY_FORM);

  // Mensagem de erro exibida dentro do modal (validações ou erros da API)
  const [formError, setFormError] = useState("");

  // Indica se o formulário está sendo enviado para a API (desabilita botões)
  const [saving, setSaving]       = useState(false);

  // Referência do produto sendo excluído (null = nenhum; string = ref em exclusão)
  const [deleting, setDeleting]   = useState(null);

  // Referência ao input de arquivo (para acesso programático se necessário)
  const fileRef                   = useRef(null);

  // Busca todos os produtos da API e atualiza o estado.
  // Chamada na montagem do componente e também pelo botão "Atualizar".
  const load = () => {
    setLoading(true);
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Executa load() uma única vez ao montar o componente (array de deps vazio).
  useEffect(() => { load(); }, []);

  // Lista de produtos filtrada com base nos três filtros ativos.
  // useMemo evita recalcular a cada renderização desnecessária.
  // Recalcula apenas quando products, search, catFilter ou stockFilter mudam.
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      // Verifica se o produto corresponde ao texto de busca
      const matchSearch = !q ||
        p.name?.toLowerCase().includes(q) ||
        p.ref?.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q);
      // Verifica se a categoria do produto corresponde ao filtro
      const matchCat   = catFilter === "all" || p.category === catFilter;
      // Verifica disponibilidade de estoque conforme o filtro
      const matchStock = stockFilter === "all" || (stockFilter === "in" ? p.qnt > 0 : p.qnt === 0);
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, catFilter, stockFilter]);

  // Abre o modal para criação de novo produto.
  // Limpa o formulário e define editRef como null (modo criação).
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditRef(null);
    setFormError("");
    setShowModal(true);
  };

  // Abre o modal pré-preenchido com os dados do produto selecionado para edição.
  // Define editRef com a referência do produto (usada no submit para chamar updateProductByRef).
  const openEdit = (p) => {
    setForm({ name: p.name, ref: p.ref, price: String(p.price), qnt: String(p.qnt), marca: p.marca, category: p.category, image: p.image || "" });
    setEditRef(p.ref);
    setFormError("");
    setShowModal(true);
  };

  // Fecha o modal e limpa os erros do formulário.
  const closeModal = () => { setShowModal(false); setFormError(""); };

  // Lida com o upload de imagem local:
  //   - Valida o tipo do arquivo (apenas JPG, PNG, WebP)
  //   - Converte para base64 via FileReader
  //   - Valida o tamanho máximo (2MB)
  //   - Atualiza o campo "image" no estado do formulário
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Apenas JPG, PNG ou WebP são aceitos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      // Verifica se a imagem não ultrapassa 2MB em base64
      if (base64.length > 2048 * 1024) {
        setFormError("Imagem muito grande. Use uma URL externa ou uma imagem menor.");
        return;
      }
      // Salva a imagem em base64 no estado do formulário
      setForm((f) => ({ ...f, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Valida e envia o formulário para criar ou atualizar um produto.
  // Em modo edição (editRef !== null): chama updateProductByRef.
  // Em modo criação (editRef === null): chama createProduct.
  // Atualiza a lista local de produtos sem recarregar da API (otimismo).
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const price = Number(form.price);
    const qnt   = Number(form.qnt);

    // Validações do formulário antes de enviar à API
    if (!form.name.trim())   { setFormError("Nome é obrigatório."); return; }
    if (!form.ref.trim())    { setFormError("Referência é obrigatória."); return; }
    if (!form.marca.trim())  { setFormError("Marca é obrigatória."); return; }
    if (isNaN(price) || price <= 0) { setFormError("Preço deve ser maior que zero."); return; }
    if (isNaN(qnt) || qnt < 0)      { setFormError("Quantidade não pode ser negativa."); return; }

    // Monta o payload limpo para enviar à API
    const payload = {
      name: form.name.trim(),
      ref: form.ref.trim().toUpperCase(), // Referência sempre em maiúsculas
      price,
      qnt,
      marca: form.marca.trim(),
      category: form.category,
      image: form.image || null,          // null se nenhuma imagem foi informada
    };

    setSaving(true);
    try {
      if (editRef) {
        // Modo edição: atualiza o produto existente e substitui na lista local
        const updated = await updateProductByRef(editRef, payload);
        setProducts((prev) => prev.map((p) => (p.ref === editRef ? updated : p)));
        setSuccess("Produto atualizado com sucesso.");
      } else {
        // Modo criação: cria o produto e o adiciona no início da lista local
        const created = await createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        setSuccess("Produto criado com sucesso.");
      }
      closeModal();
      // A mensagem de sucesso desaparece após 3 segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      // Exibe erro da API dentro do modal (ex: referência duplicada)
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Exibe uma confirmação antes de excluir e chama a API de exclusão.
  // Remove o produto da lista local sem recarregar (atualização otimista).
  const handleDelete = async (ref) => {
    if (!window.confirm(`Excluir produto "${ref}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(ref);
    try {
      await deleteProductByRef(ref);
      // Remove o produto da lista local pelo campo "ref"
      setProducts((prev) => prev.filter((p) => p.ref !== ref));
      setSuccess("Produto excluído.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Cabeçalho da página com título, contador e botões de ação */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Produtos</h1>
          {/* Contador total de produtos cadastrados */}
          <p className="page-subtitle">{products.length} produtos cadastrados</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* Botão para recarregar a lista da API */}
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <FaSyncAlt /> Atualizar
          </button>
          {/* Botão para abrir o modal de criação de novo produto */}
          <button className="btn btn-primary" onClick={openCreate}>
            <FaPlus /> Novo Produto
          </button>
        </div>
      </div>

      {/* Alertas de erro e sucesso — aparecem abaixo do cabeçalho */}
      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {/* Barra de ferramentas: busca por texto + filtros de categoria e estoque */}
        <div className="produtos-toolbar">
          {/* Campo de busca com ícone e botão de limpar */}
          <div className="pedidos-search" style={{ maxWidth: 320 }}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome, ref ou marca…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Botão "X" para limpar a busca — aparece apenas quando há texto */}
            {search && <button className="search-clear" onClick={() => setSearch("")}><FaTimes /></button>}
          </div>

          {/* Filtros de categoria e estoque lado a lado */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Dropdown de categoria — "Todas categorias" = sem filtro */}
            <select className="filter-select" value={catFilter} onChange={(e) => setCat(e.target.value)}>
              <option value="all">Todas categorias</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Dropdown de disponibilidade em estoque */}
            <select className="filter-select" value={stockFilter} onChange={(e) => setStock(e.target.value)}>
              <option value="all">Todo estoque</option>
              <option value="in">Em estoque</option>
              <option value="out">Sem estoque</option>
            </select>
          </div>
        </div>

        {/* Conteúdo principal: spinner, estado vazio ou tabela de produtos */}
        {loading ? (
          // Indicador de carregamento
          <div className="spinner">Carregando produtos…</div>
        ) : filtered.length === 0 ? (
          // Nenhum produto encontrado com os filtros atuais
          <p style={{ color: "var(--text-secondary)", padding: "2rem 0", textAlign: "center" }}>Nenhum produto encontrado.</p>
        ) : (
          // Tabela responsiva com scroll horizontal em telas pequenas
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Imagem</th>
                  <th>Ref.</th>
                  <th>Nome</th>
                  <th>Marca</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th></th> {/* Coluna dos botões de ação */}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.ref || p.id}>
                    {/* Miniatura da imagem do produto ou placeholder cinza */}
                    <td>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                          onError={(e) => { e.target.style.display = "none"; }} // Oculta se a URL for inválida
                        />
                      ) : (
                        // Placeholder quando não há imagem
                        <div style={{ width: 40, height: 40, background: "var(--surface-2)", borderRadius: 6, border: "1px solid var(--border)" }} />
                      )}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.ref}</td>
                    <td style={{ maxWidth: 180, fontSize: "0.875rem" }}>{p.name}</td>
                    <td style={{ fontSize: "0.85rem" }}>{p.marca}</td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{p.category}</td>
                    <td style={{ fontWeight: 600 }}>{formatBRL(p.price)}</td>
                    <td style={{ textAlign: "center" }}>{p.qnt}</td>
                    {/* Badge calculado dinamicamente com base nas propriedades do produto */}
                    <td><StatusBadge product={p} /></td>
                    {/* Botões de editar e excluir por produto */}
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)} title="Editar">
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(p.ref)}
                          disabled={deleting === p.ref} // Desabilita apenas o botão do item sendo excluído
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de criação/edição de produto.
          O título muda dinamicamente: "Novo Produto" ou "Editar Produto".
          Clicando no overlay (fundo escuro) o modal fecha. */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          {/* stopPropagation evita que clicar dentro do modal feche ele */}
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editRef ? "Editar Produto" : "Novo Produto"}</h2>
              <button className="modal-close" onClick={closeModal}><FaTimes /></button>
            </div>

            {/* Erro de validação ou da API exibido dentro do modal */}
            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSubmit}>
              {/* Grid de 2 colunas para os campos do formulário */}
              <div className="grid-2">
                {/* Nome do produto — ocupa 2 colunas */}
                <div className="input-group col-span-2">
                  <label>Nome do produto *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>

                {/* Referência — bloqueada para edição (identificador único do produto) */}
                <div className="input-group">
                  <label>Referência (REF) *</label>
                  <input value={form.ref} onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))} required disabled={!!editRef} />
                </div>

                {/* Marca do produto */}
                <div className="input-group">
                  <label>Marca *</label>
                  <input value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} required />
                </div>

                {/* Preço — aceita decimais, mínimo R$ 0,01 */}
                <div className="input-group">
                  <label>Preço (R$) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>

                {/* Quantidade em estoque — inteiro, mínimo 0 */}
                <div className="input-group">
                  <label>Quantidade em estoque *</label>
                  <input type="number" min="0" step="1" value={form.qnt} onChange={(e) => setForm((f) => ({ ...f, qnt: e.target.value }))} required />
                </div>

                {/* Seletor de categoria */}
                <div className="input-group">
                  <label>Categoria</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Campo de URL da imagem — fica vazio se foi feito upload local */}
                <div className="input-group">
                  <label>URL da imagem ou upload</label>
                  <input
                    type="text"
                    placeholder="https://... ou selecione um arquivo abaixo"
                    // Não exibe a string base64 no campo de texto (apenas URLs externas)
                    value={form.image.startsWith("data:") ? "" : form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  />
                </div>

                {/* Upload de arquivo de imagem local — convertido para base64 */}
                <div className="input-group col-span-2">
                  <label>Upload de imagem (JPG / PNG / WebP — máx. 2MB)</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileRef} onChange={handleImageFile} />
                </div>

                {/* Preview da imagem selecionada (URL ou base64) */}
                {form.image && (
                  <div className="col-span-2">
                    <img
                      src={form.image}
                      alt="preview"
                      style={{ height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                      onError={(e) => { e.target.style.display = "none"; }} // Oculta se URL inválida
                    />
                  </div>
                )}
              </div>

              {/* Botões de ação do modal: Cancelar e Salvar/Criar */}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {/* Texto do botão muda conforme o estado: salvando, editando ou criando */}
                  {saving ? "Salvando…" : editRef ? "Atualizar" : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
