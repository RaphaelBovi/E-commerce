import { useEffect, useMemo, useState, useRef } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSyncAlt, FaTimes } from "react-icons/fa";
import {
  fetchProducts,
  createProduct,
  updateProductByRef,
  deleteProductByRef,
} from "../services/productsApi.js";
import "./GestaoProdutos.css";

const CATEGORIES = ["mais-vendidos", "novidades", "geral"];
const EMPTY_FORM = { name: "", ref: "", price: "", qnt: "", marca: "", category: "geral", image: "" };

function StatusBadge({ product }) {
  if (product.qnt === 0) return <span className="badge badge-cancelled">Sem Estoque</span>;
  if (product.category === "novidades") return <span className="badge badge-shipped">Lançamento</span>;
  if (Number(product.price) <= 2000) return <span className="badge badge-pending">Promoção</span>;
  return <span className="badge badge-paid">Ativo</span>;
}

function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GestaoProdutos() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [search, setSearch]       = useState("");
  const [catFilter, setCat]       = useState("all");
  const [stockFilter, setStock]   = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editRef, setEditRef]     = useState(null); // null = create, string = edit
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const fileRef                   = useRef(null);

  const load = () => {
    setLoading(true);
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.name?.toLowerCase().includes(q) ||
        p.ref?.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q);
      const matchCat   = catFilter === "all" || p.category === catFilter;
      const matchStock = stockFilter === "all" || (stockFilter === "in" ? p.qnt > 0 : p.qnt === 0);
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, catFilter, stockFilter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditRef(null);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({ name: p.name, ref: p.ref, price: String(p.price), qnt: String(p.qnt), marca: p.marca, category: p.category, image: p.image || "" });
    setEditRef(p.ref);
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(""); };

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
      if (base64.length > 2048 * 1024) {
        setFormError("Imagem muito grande. Use uma URL externa ou uma imagem menor.");
        return;
      }
      setForm((f) => ({ ...f, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const price = Number(form.price);
    const qnt   = Number(form.qnt);

    if (!form.name.trim())   { setFormError("Nome é obrigatório."); return; }
    if (!form.ref.trim())    { setFormError("Referência é obrigatória."); return; }
    if (!form.marca.trim())  { setFormError("Marca é obrigatória."); return; }
    if (isNaN(price) || price <= 0) { setFormError("Preço deve ser maior que zero."); return; }
    if (isNaN(qnt) || qnt < 0)      { setFormError("Quantidade não pode ser negativa."); return; }

    const payload = {
      name: form.name.trim(),
      ref: form.ref.trim().toUpperCase(),
      price,
      qnt,
      marca: form.marca.trim(),
      category: form.category,
      image: form.image || null,
    };

    setSaving(true);
    try {
      if (editRef) {
        const updated = await updateProductByRef(editRef, payload);
        setProducts((prev) => prev.map((p) => (p.ref === editRef ? updated : p)));
        setSuccess("Produto atualizado com sucesso.");
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        setSuccess("Produto criado com sucesso.");
      }
      closeModal();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ref) => {
    if (!window.confirm(`Excluir produto "${ref}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(ref);
    try {
      await deleteProductByRef(ref);
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Produtos</h1>
          <p className="page-subtitle">{products.length} produtos cadastrados</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <FaSyncAlt /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <FaPlus /> Novo Produto
          </button>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {/* Toolbar */}
        <div className="produtos-toolbar">
          <div className="pedidos-search" style={{ maxWidth: 320 }}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome, ref ou marca…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="search-clear" onClick={() => setSearch("")}><FaTimes /></button>}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select className="filter-select" value={catFilter} onChange={(e) => setCat(e.target.value)}>
              <option value="all">Todas categorias</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={stockFilter} onChange={(e) => setStock(e.target.value)}>
              <option value="all">Todo estoque</option>
              <option value="in">Em estoque</option>
              <option value="out">Sem estoque</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="spinner">Carregando produtos…</div>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "2rem 0", textAlign: "center" }}>Nenhum produto encontrado.</p>
        ) : (
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.ref || p.id}>
                    <td>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, background: "var(--surface-2)", borderRadius: 6, border: "1px solid var(--border)" }} />
                      )}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.ref}</td>
                    <td style={{ maxWidth: 180, fontSize: "0.875rem" }}>{p.name}</td>
                    <td style={{ fontSize: "0.85rem" }}>{p.marca}</td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{p.category}</td>
                    <td style={{ fontWeight: 600 }}>{formatBRL(p.price)}</td>
                    <td style={{ textAlign: "center" }}>{p.qnt}</td>
                    <td><StatusBadge product={p} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)} title="Editar">
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(p.ref)}
                          disabled={deleting === p.ref}
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

      {/* Modal criar/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editRef ? "Editar Produto" : "Novo Produto"}</h2>
              <button className="modal-close" onClick={closeModal}><FaTimes /></button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="input-group col-span-2">
                  <label>Nome do produto *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>Referência (REF) *</label>
                  <input value={form.ref} onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))} required disabled={!!editRef} />
                </div>
                <div className="input-group">
                  <label>Marca *</label>
                  <input value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>Preço (R$) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>Quantidade em estoque *</label>
                  <input type="number" min="0" step="1" value={form.qnt} onChange={(e) => setForm((f) => ({ ...f, qnt: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>Categoria</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>URL da imagem ou upload</label>
                  <input
                    type="text"
                    placeholder="https://... ou selecione um arquivo abaixo"
                    value={form.image.startsWith("data:") ? "" : form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  />
                </div>
                <div className="input-group col-span-2">
                  <label>Upload de imagem (JPG / PNG / WebP — máx. 2MB)</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileRef} onChange={handleImageFile} />
                </div>
                {form.image && (
                  <div className="col-span-2">
                    <img
                      src={form.image}
                      alt="preview"
                      style={{ height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
