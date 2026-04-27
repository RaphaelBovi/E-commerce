import { useEffect, useRef, useState } from "react";
import { FaPlus, FaTrash, FaEdit, FaTimes, FaToggleOn, FaToggleOff, FaUpload, FaInfoCircle } from "react-icons/fa";
import { apiFetch } from "../services/apiClient.js";

const POSITIONS = ["HERO", "PROMO_BAR", "FEATURED"];

const POSITION_SPECS = {
  HERO: {
    label: "Hero (Banner Principal)",
    width: 1920, height: 640,
    ratio: "3:1",
    desc: "Banner de destaque na página inicial. Ocupa toda a largura.",
  },
  PROMO_BAR: {
    label: "Barra Promocional",
    width: 1920, height: 80,
    ratio: "24:1",
    desc: "Faixa fina no topo da página. Ideal para avisos e promoções rápidas.",
  },
  FEATURED: {
    label: "Destaque",
    width: 800, height: 400,
    ratio: "2:1",
    desc: "Banner de seção em grade. Usado em cards de destaque e campanhas.",
  },
};

const EMPTY = { title: "", subtitle: "", imageUrl: "", linkUrl: "", position: "HERO", active: true, displayOrder: 0 };

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BannersAdmin() {
  const [banners, setBanners]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    apiFetch("/banners/admin")
      .then(setBanners)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const openCreate = () => { setForm(EMPTY); setEditId(null); setFormError(""); setShowModal(true); };
  const openEdit = (b) => {
    setForm({
      title: b.title, subtitle: b.subtitle || "", imageUrl: b.imageUrl || "",
      linkUrl: b.linkUrl || "", position: b.position, active: b.active, displayOrder: b.displayOrder,
    });
    setEditId(b.id);
    setFormError("");
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFormError(""); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFormError("A imagem deve ter no máximo 5 MB."); return; }
    setUploading(true);
    try {
      const base64 = await toBase64(file);
      setForm((f) => ({ ...f, imageUrl: base64 }));
      setFormError("");
    } catch {
      setFormError("Erro ao ler o arquivo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Título é obrigatório."); return; }
    setSaving(true);
    try {
      if (editId) {
        const updated = await apiFetch(`/banners/admin/${editId}`, { method: "PUT", body: JSON.stringify(form) });
        setBanners((prev) => prev.map((b) => (b.id === editId ? updated : b)));
        flash("Banner atualizado.");
      } else {
        const created = await apiFetch("/banners/admin", { method: "POST", body: JSON.stringify(form) });
        setBanners((prev) => [...prev, created]);
        flash("Banner criado.");
      }
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await apiFetch(`/banners/admin/${id}/toggle`, { method: "PATCH" });
      setBanners((prev) => prev.map((b) => b.id === id ? { ...b, active: !b.active } : b));
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir este banner?")) return;
    try {
      await apiFetch(`/banners/admin/${id}`, { method: "DELETE" });
      setBanners((prev) => prev.filter((b) => b.id !== id));
      flash("Banner excluído.");
    } catch (err) { setError(err.message); }
  };

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const spec = POSITION_SPECS[form.position];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banners</h1>
          <p className="page-subtitle">{banners.length} banner{banners.length !== 1 ? "s" : ""} cadastrado{banners.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><FaPlus /> Novo Banner</button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? (
          <div className="spinner">Carregando…</div>
        ) : banners.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "2rem", textAlign: "center" }}>Nenhum banner cadastrado.</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Imagem</th>
                  <th>Título</th>
                  <th>Posição</th>
                  <th>Ordem</th>
                  <th>Ativo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b.id}>
                    <td>
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.title}
                          style={{ width: 72, height: 40, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border)" }} />
                      ) : (
                        <div style={{ width: 72, height: 40, background: "var(--surface-2)", borderRadius: 4, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          Sem img
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{b.title}</div>
                      {b.subtitle && <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{b.subtitle}</div>}
                    </td>
                    <td><span className="badge badge-paid">{b.position}</span></td>
                    <td style={{ textAlign: "center" }}>{b.displayOrder}</td>
                    <td>
                      <button
                        onClick={() => handleToggle(b.id)}
                        style={{ background: "none", border: "none", cursor: "pointer",
                          color: b.active ? "var(--success)" : "var(--text-muted)", fontSize: "1.4rem" }}
                        title={b.active ? "Desativar" : "Ativar"}
                      >
                        {b.active ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)} title="Editar"><FaEdit /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)} title="Excluir"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? "Editar Banner" : "Novo Banner"}</h2>
              <button className="modal-close" onClick={closeModal}><FaTimes /></button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSubmit}>
              {/* Posição + Ordem */}
              <div className="grid-2">
                <div className="input-group">
                  <label>Posição</label>
                  <select value={form.position} onChange={field("position")}>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{POSITION_SPECS[p].label}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Ordem de exibição</label>
                  <input type="number" min="0" value={form.displayOrder}
                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
                </div>
              </div>

              {/* Guia de proporções — dinâmico por posição */}
              <div style={{
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "0.85rem 1rem", marginBottom: "1rem",
                display: "flex", gap: "0.65rem", alignItems: "flex-start",
              }}>
                <FaInfoCircle style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>
                  <strong style={{ display: "block", marginBottom: "0.2rem" }}>
                    Especificações para o designer — {spec.label}
                  </strong>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Dimensões recomendadas: <strong>{spec.width} × {spec.height} px</strong> &nbsp;·&nbsp; Proporção: <strong>{spec.ratio}</strong>
                  </span>
                  <br />
                  <span style={{ color: "var(--text-muted)" }}>{spec.desc}</span>
                  <br />
                  <span style={{ color: "var(--text-muted)" }}>Formatos aceitos: JPG, PNG, WebP · Máximo: 5 MB</span>
                </div>
              </div>

              {/* Upload de imagem */}
              <div className="input-group">
                <label>Imagem do banner</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <FaUpload />
                  {uploading ? "Carregando…" : form.imageUrl ? "Trocar imagem" : "Selecionar imagem"}
                </button>
              </div>

              {/* Preview */}
              {form.imageUrl && (
                <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)", display: "block" }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    style={{
                      position: "absolute", top: 6, right: 6,
                      background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
                      width: 26, height: 26, cursor: "pointer",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="Remover imagem"
                  ><FaTimes style={{ fontSize: "0.7rem" }} /></button>
                </div>
              )}

              {/* Título e Subtítulo */}
              <div className="input-group">
                <label>Título *</label>
                <input value={form.title} onChange={field("title")} placeholder="Ex: Promoção de Verão" required />
              </div>
              <div className="input-group">
                <label>Subtítulo <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span></label>
                <input value={form.subtitle} onChange={field("subtitle")} placeholder="Ex: Até 50% de desconto em produtos selecionados" />
              </div>
              <div className="input-group">
                <label>URL de destino <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span></label>
                <input type="url" value={form.linkUrl} onChange={field("linkUrl")} placeholder="https://sualoja.com.br/promocoes" />
              </div>

              <div className="input-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" id="active-chk" checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                <label htmlFor="active-chk" style={{ margin: 0 }}>Ativo (visível na loja)</label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? "Salvando…" : editId ? "Atualizar" : "Criar Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
