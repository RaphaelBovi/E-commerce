import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaEdit, FaTimes, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { apiFetch } from "../services/apiClient.js";

const POSITIONS = ["HERO", "PROMO_BAR", "FEATURED"];
const EMPTY = { title: "", subtitle: "", imageUrl: "", linkUrl: "", position: "HERO", active: true, displayOrder: 0 };

export default function BannersAdmin() {
  const [banners, setBanners]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");

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
    setForm({ title: b.title, subtitle: b.subtitle || "", imageUrl: b.imageUrl || "",
      linkUrl: b.linkUrl || "", position: b.position, active: b.active, displayOrder: b.displayOrder });
    setEditId(b.id);
    setFormError("");
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFormError(""); };

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
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir este banner?")) return;
    try {
      await apiFetch(`/banners/admin/${id}`, { method: "DELETE" });
      setBanners((prev) => prev.filter((b) => b.id !== id));
      flash("Banner excluído.");
    } catch (err) {
      setError(err.message);
    }
  };

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
                          style={{ width: 60, height: 36, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border)" }} />
                      ) : (
                        <div style={{ width: 60, height: 36, background: "var(--surface-2)", borderRadius: 4, border: "1px solid var(--border)" }} />
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? "Editar Banner" : "Novo Banner"}</h2>
              <button className="modal-close" onClick={closeModal}><FaTimes /></button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Título *</label>
                <input value={form.title} onChange={field("title")} required />
              </div>
              <div className="input-group">
                <label>Subtítulo</label>
                <input value={form.subtitle} onChange={field("subtitle")} />
              </div>
              <div className="input-group">
                <label>URL da imagem</label>
                <input type="url" value={form.imageUrl} onChange={field("imageUrl")} placeholder="https://…" />
              </div>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="preview"
                  style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, marginBottom: "0.75rem", border: "1px solid var(--border)" }} />
              )}
              <div className="input-group">
                <label>URL de destino (link)</label>
                <input type="url" value={form.linkUrl} onChange={field("linkUrl")} placeholder="https://…" />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Posição</label>
                  <select value={form.position} onChange={field("position")}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Ordem de exibição</label>
                  <input type="number" min="0" value={form.displayOrder}
                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="input-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" id="active-chk" checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                <label htmlFor="active-chk" style={{ margin: 0 }}>Ativo (visível na loja)</label>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Salvando…" : editId ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
