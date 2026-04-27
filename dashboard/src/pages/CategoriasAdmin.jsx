import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaTimes, FaTag } from "react-icons/fa";
import {
  fetchAdminCategories,
  createCategory,
  renameCategory,
  toggleCategory,
  deleteCategory,
} from "../services/categoriesApi.js";
import "./CategoriasAdmin.css";

export default function CategoriasAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [formName, setFormName]   = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving]       = useState(false);

  const load = () => {
    setLoading(true);
    fetchAdminCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const openCreate = () => {
    setEditId(null);
    setFormName("");
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditId(cat.id);
    setFormName(cat.name);
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) { setFormError("Nome é obrigatório."); return; }
    if (name.length < 2) { setFormError("Nome deve ter ao menos 2 caracteres."); return; }
    setSaving(true);
    try {
      if (editId) {
        const updated = await renameCategory(editId, name);
        setCategories((prev) => prev.map((c) => (c.id === editId ? updated : c)));
        flash("Categoria atualizada.");
      } else {
        const created = await createCategory(name);
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
        flash("Categoria criada.");
      }
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat) => {
    try {
      const updated = await toggleCategory(cat.id);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Excluir categoria "${cat.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      flash("Categoria excluída.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorias</h1>
          <p className="page-subtitle">{categories.length} categorias cadastradas</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FaPlus /> Nova Categoria
        </button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? (
          <div className="spinner">Carregando…</div>
        ) : categories.length === 0 ? (
          <div className="cat-empty">
            <FaTag />
            <p>Nenhuma categoria cadastrada. Crie a primeira!</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Criada em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className={!cat.active ? "cat-row--inactive" : ""}>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--text-secondary)" }}>{cat.slug}</td>
                    <td>
                      {cat.active
                        ? <span className="badge badge-paid">Ativa</span>
                        : <span className="badge badge-cancelled">Inativa</span>}
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggle(cat)}
                          title={cat.active ? "Desativar" : "Ativar"}
                        >
                          {cat.active ? <FaToggleOn style={{ color: "var(--success)" }} /> : <FaToggleOff />}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(cat)} title="Renomear">
                          <FaEdit />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat)} title="Excluir">
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? "Renomear Categoria" : "Nova Categoria"}</h2>
              <button className="modal-close" onClick={closeModal}><FaTimes /></button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Nome da categoria *</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Mais Vendidos"
                  autoFocus
                  required
                />
                <p className="cat-slug-hint">O slug será gerado automaticamente. Ex: "Mais Vendidos" → <code>mais-vendidos</code></p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Salvando…" : editId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
