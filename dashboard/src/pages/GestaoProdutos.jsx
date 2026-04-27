import { useEffect, useMemo, useRef, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSyncAlt, FaTimes, FaTag, FaImages, FaUpload, FaChevronLeft, FaChevronRight, FaFileCsv } from "react-icons/fa";

const PAGE_SIZE = 20;
import {
  fetchProducts,
  createProduct,
  updateProductByRef,
  deleteProductByRef,
  importProductsCsv,
} from "../services/productsApi.js";
import { fetchPublicCategories } from "../services/categoriesApi.js";
import "./GestaoProdutos.css";

const MAX_IMAGES  = 5;
const MAX_DIM     = 1200;   // max width/height in px after resize
const MAX_BYTES   = 1024 * 1024; // 1 MB target per image (base64 ~1.37x raw)

const EMPTY_FORM = {
  name: "", ref: "", price: "", promotionalPrice: "",
  qnt: "", marca: "", category: "",
  image: "", images: [],
  weightKg: "", widthCm: "", heightCm: "", lengthCm: "",
};

// ─── Image compression via Canvas ────────────────────────────────
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        // Scale down maintaining aspect ratio
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height * MAX_DIM) / width);
            width  = MAX_DIM;
          } else {
            width  = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        // Reduce quality until under target size
        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > MAX_BYTES * 1.4 && quality > 0.3) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Status badge ─────────────────────────────────────────────────
function StatusBadge({ product }) {
  if (product.qnt === 0)     return <span className="badge badge-cancelled">Sem Estoque</span>;
  if (product.isPromo)       return <span className="badge badge-pending">Promoção</span>;
  if (product.category === "novidades") return <span className="badge badge-shipped">Lançamento</span>;
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
  const [promoFilter, setPromo]   = useState("all"); // 'all' | 'yes' | 'no'
  const [showModal, setShowModal] = useState(false);
  const [editRef, setEditRef]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [categories, setCategories]   = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult]       = useState(null);
  const csvInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    fetchPublicCategories()
      .then((cats) => setCategories(cats.map((c) => c.slug)))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    setCurrentPage(1);
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.name?.toLowerCase().includes(q) ||
        p.ref?.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q);
      const matchCat    = catFilter   === "all" || p.category === catFilter;
      const matchStock  = stockFilter === "all" || (stockFilter === "in" ? p.qnt > 0 : p.qnt === 0);
      const matchPromo  = promoFilter === "all" || (promoFilter === "yes" ? p.isPromo : !p.isPromo);
      return matchSearch && matchCat && matchStock && matchPromo;
    });
  }, [products, search, catFilter, stockFilter, promoFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditRef(null);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({
      name:  p.name,
      ref:   p.ref,
      price: String(p.price),
      promotionalPrice: p.promotionalPrice != null ? String(p.promotionalPrice) : "",
      qnt:   String(p.qnt),
      marca: p.marca,
      category: p.category,
      image: "",       // legacy field not shown in edit
      images: p.images || [],
      weightKg: p.weightKg != null ? String(p.weightKg) : "",
      widthCm:  p.widthCm  != null ? String(p.widthCm)  : "",
      heightCm: p.heightCm != null ? String(p.heightCm) : "",
      lengthCm: p.lengthCm != null ? String(p.lengthCm) : "",
    });
    setEditRef(p.ref);
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(""); };

  // ── Upload + compress image files ──────────────────────────────
  const handleImageFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      setFormError(`Máximo de ${MAX_IMAGES} imagens por produto.`);
      return;
    }

    const toProcess = files.slice(0, remaining);
    setCompressing(true);
    setFormError("");

    try {
      const compressed = await Promise.all(toProcess.map((f) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
          throw new Error("Apenas JPG, PNG ou WebP são aceitos.");
        }
        return compressImage(f);
      }));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...compressed] }));
    } catch (err) {
      setFormError(err.message || "Erro ao processar imagem.");
    } finally {
      setCompressing(false);
      e.target.value = ""; // reset input
    }
  };

  const removeImage = (idx) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const moveImage = (from, to) => {
    setForm((prev) => {
      const imgs = [...prev.images];
      const [item] = imgs.splice(from, 1);
      imgs.splice(to, 0, item);
      return { ...prev, images: imgs };
    });
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const price = Number(form.price);
    const qnt   = Number(form.qnt);
    const promoPrice = form.promotionalPrice.trim() === "" ? null : Number(form.promotionalPrice);

    if (!form.name.trim())  { setFormError("Nome é obrigatório."); return; }
    if (!form.ref.trim())   { setFormError("Referência é obrigatória."); return; }
    if (!form.marca.trim()) { setFormError("Marca é obrigatória."); return; }
    if (isNaN(price) || price <= 0) { setFormError("Preço deve ser maior que zero."); return; }
    if (isNaN(qnt) || qnt < 0)     { setFormError("Quantidade não pode ser negativa."); return; }
    if (promoPrice !== null) {
      if (isNaN(promoPrice) || promoPrice <= 0) { setFormError("Preço promocional deve ser maior que zero."); return; }
      if (promoPrice >= price) { setFormError("Preço promocional deve ser menor que o preço original."); return; }
    }

    const weightKg = form.weightKg.trim() === "" ? null : Number(form.weightKg);
    const widthCm  = form.widthCm.trim()  === "" ? null : Number(form.widthCm);
    const heightCm = form.heightCm.trim() === "" ? null : Number(form.heightCm);
    const lengthCm = form.lengthCm.trim() === "" ? null : Number(form.lengthCm);

    const payload = {
      name: form.name.trim(),
      ref:  form.ref.trim().toUpperCase(),
      price,
      promotionalPrice: promoPrice,
      qnt,
      marca:    form.marca.trim(),
      category: form.category,
      image:    null,
      images:   form.images,
      weightKg,
      widthCm,
      heightCm,
      lengthCm,
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

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCsvImporting(true);
    setCsvResult(null);
    try {
      const result = await importProductsCsv(file);
      setCsvResult(result);
      if (result.imported > 0) load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCsvImporting(false);
    }
  };

  const downloadCsvTemplate = () => {
    const header = "name,ref,price,promotionalPrice,qnt,marca,category,weightKg,widthCm,heightCm,lengthCm\n";
    const sample = "Camiseta Básica,CAM-001,59.90,,10,MinhaМарка,roupas,0.3,30,5,40\n";
    const blob = new Blob([header + sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_produtos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const promoCount = products.filter((p) => p.isPromo).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Produtos</h1>
          <p className="page-subtitle">
            {products.length} produtos cadastrados
            {promoCount > 0 && <> · <span style={{ color: "var(--danger)" }}><FaTag style={{ marginRight: 4 }} />{promoCount} em promoção</span></>}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <FaSyncAlt /> Atualizar
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => csvInputRef.current?.click()} disabled={csvImporting}>
            <FaFileCsv /> {csvImporting ? "Importando…" : "Importar CSV"}
          </button>
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleCsvUpload} />
          <button className="btn btn-primary" onClick={openCreate}>
            <FaPlus /> Novo Produto
          </button>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {csvResult && (
        <div className={`alert ${csvResult.errors.length > 0 && csvResult.imported === 0 ? "alert-error" : "alert-success"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <strong>{csvResult.imported} produto{csvResult.imported !== 1 ? "s" : ""} importado{csvResult.imported !== 1 ? "s" : ""}.</strong>
              {csvResult.errors.length > 0 && <> · {csvResult.errors.length} linha{csvResult.errors.length !== 1 ? "s" : ""} com erro.</>}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button className="btn btn-outline btn-sm" style={{ fontSize: "0.75rem" }} onClick={downloadCsvTemplate}>
                Baixar template CSV
              </button>
              <button className="btn btn-outline btn-sm" style={{ fontSize: "0.75rem" }} onClick={() => setCsvResult(null)}>
                <FaTimes />
              </button>
            </div>
          </div>
          {csvResult.errors.length > 0 && (
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", fontSize: "0.8rem" }}>
              {csvResult.errors.map((e) => (
                <li key={e.row}>Linha {e.row}: {e.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="card">
        <div className="produtos-toolbar">
          <div className="pedidos-search" style={{ maxWidth: 300 }}>
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
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={stockFilter} onChange={(e) => setStock(e.target.value)}>
              <option value="all">Todo estoque</option>
              <option value="in">Em estoque</option>
              <option value="out">Sem estoque</option>
            </select>
            <select className="filter-select" value={promoFilter} onChange={(e) => setPromo(e.target.value)}>
              <option value="all">Todas promoções</option>
              <option value="yes">Em promoção</option>
              <option value="no">Sem promoção</option>
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
                  <th>Promoção</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  const thumb = p.images?.[0] || p.image;
                  return (
                    <tr key={p.ref || p.id}>
                      <td>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={p.name}
                              style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <div style={{ width: 40, height: 40, background: "var(--surface-2)", borderRadius: 6, border: "1px solid var(--border)" }} />
                          )}
                          {p.images?.length > 1 && (
                            <span className="gp-img-count">{p.images.length}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.ref}</td>
                      <td style={{ maxWidth: 180, fontSize: "0.875rem" }}>{p.name}</td>
                      <td style={{ fontSize: "0.85rem" }}>{p.marca}</td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{p.category}</td>
                      <td style={{ fontWeight: 600 }}>{formatBRL(p.price)}</td>
                      <td>
                        {p.isPromo ? (
                          <span style={{ color: "var(--danger)", fontWeight: 700, fontSize: "0.88rem" }}>
                            {formatBRL(p.promotionalPrice)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                        )}
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Paginação ── */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="gp-pagination">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              <FaChevronLeft /> Anterior
            </button>
            <span className="gp-page-info">
              Página {safePage} de {totalPages} · {filtered.length} produtos
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Próxima <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
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
                {/* Nome */}
                <div className="input-group col-span-2">
                  <label>Nome do produto *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>

                {/* Ref + Marca */}
                <div className="input-group">
                  <label>Referência (REF) *</label>
                  <input value={form.ref} onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))} required disabled={!!editRef} />
                </div>
                <div className="input-group">
                  <label>Marca *</label>
                  <input value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} required />
                </div>

                {/* Preço + Preço Promocional */}
                <div className="input-group">
                  <label>Preço original (R$) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>
                    Preço promocional (R$)
                    <span className="gp-promo-hint"> — deixe vazio para remover</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Menor que o preço original"
                    value={form.promotionalPrice}
                    onChange={(e) => setForm((f) => ({ ...f, promotionalPrice: e.target.value }))}
                    className={form.promotionalPrice ? "gp-promo-input" : ""}
                  />
                  {form.promotionalPrice && Number(form.price) > 0 && Number(form.promotionalPrice) > 0 && (
                    <p className="gp-discount-preview">
                      Desconto: {Math.round((1 - Number(form.promotionalPrice) / Number(form.price)) * 100)}%
                    </p>
                  )}
                </div>

                {/* Qtd + Categoria */}
                <div className="input-group">
                  <label>Quantidade em estoque *</label>
                  <input type="number" min="0" step="1" value={form.qnt} onChange={(e) => setForm((f) => ({ ...f, qnt: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>Categoria</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="">Selecione…</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Multi-image upload */}
                <div className="input-group col-span-2">
                  <label>
                    <FaImages style={{ marginRight: 6 }} />
                    Imagens do produto (máx. {MAX_IMAGES} · JPG/PNG/WebP · compressão automática para 1MB)
                  </label>

                  {/* Upload area */}
                  <label className="gp-upload-area" style={{ pointerEvents: form.images.length >= MAX_IMAGES ? "none" : "auto", opacity: form.images.length >= MAX_IMAGES ? 0.5 : 1 }}>
                    <FaUpload />
                    <span>{compressing ? "Comprimindo…" : "Clique para adicionar imagens"}</span>
                    <span className="gp-upload-sub">{form.images.length}/{MAX_IMAGES} imagens</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImageFiles}
                      style={{ display: "none" }}
                      disabled={compressing || form.images.length >= MAX_IMAGES}
                    />
                  </label>

                  {/* Image previews */}
                  {form.images.length > 0 && (
                    <div className="gp-img-previews">
                      {form.images.map((src, i) => (
                        <div key={i} className="gp-img-preview-item">
                          <img src={src} alt={`img ${i + 1}`} />
                          <div className="gp-img-preview-order">
                            {i > 0 && (
                              <button type="button" className="gp-img-btn" onClick={() => moveImage(i, i - 1)} title="Mover para esquerda">←</button>
                            )}
                            {i < form.images.length - 1 && (
                              <button type="button" className="gp-img-btn" onClick={() => moveImage(i, i + 1)} title="Mover para direita">→</button>
                            )}
                          </div>
                          <button type="button" className="gp-img-remove" onClick={() => removeImage(i)} title="Remover">
                            <FaTimes />
                          </button>
                          {i === 0 && <span className="gp-img-main-badge">Principal</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping dimensions */}
              <div className="gp-section-label">Dimensões para frete <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span></div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Peso (kg)</label>
                  <input type="number" min="0.001" step="0.001" placeholder="Ex: 0.5"
                    value={form.weightKg} onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Largura (cm)</label>
                  <input type="number" min="1" step="1" placeholder="Ex: 15"
                    value={form.widthCm} onChange={(e) => setForm((f) => ({ ...f, widthCm: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Altura (cm)</label>
                  <input type="number" min="1" step="1" placeholder="Ex: 10"
                    value={form.heightCm} onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Comprimento (cm)</label>
                  <input type="number" min="1" step="1" placeholder="Ex: 20"
                    value={form.lengthCm} onChange={(e) => setForm((f) => ({ ...f, lengthCm: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving || compressing}>
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
