import { useEffect, useState } from "react";
import { FaPlus, FaTimes, FaToggleOn, FaToggleOff, FaTrash } from "react-icons/fa";
import { listCoupons, createCoupon, activateCoupon, deactivateCoupon, deleteCoupon } from "../services/couponsApi.js";
import "./CuponsAdmin.css";

const TYPE_LABELS = { PERCENT: "Percentual (%)", FIXED: "Valor fixo (R$)" };

function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

const EMPTY_FORM = {
  code: "", type: "PERCENT", value: "", minOrderAmount: "", maxUsages: "", expiresAt: "",
};

export default function CuponsAdmin() {
  const [coupons, setCoupons]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");

  const load = () => {
    setLoading(true);
    listCoupons()
      .then(setCoupons)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleField = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) { setFormError("Informe o código do cupom."); return; }
    if (!form.value || Number(form.value) <= 0) { setFormError("Informe um valor válido."); return; }
    if (form.type === "PERCENT" && Number(form.value) > 100) {
      setFormError("Desconto percentual não pode exceder 100%."); return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxUsages: form.maxUsages ? Number(form.maxUsages) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      const created = await createCoupon(payload);
      setCoupons((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      const updated = coupon.active
        ? await deactivateCoupon(coupon.id)
        : await activateCoupon(coupon.id);
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remover este cupom permanentemente?")) return;
    try {
      await deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cupons de Desconto</h1>
          <p className="page-subtitle">{coupons.length} cupons cadastrados</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setFormError(""); }}>
          <FaPlus /> Novo Cupom
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Cupom</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreate}>
              {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}
              <div className="input-group">
                <label>Código *</label>
                <input name="code" placeholder="ex: BEMVINDO10" value={form.code}
                  onChange={handleField} style={{ fontFamily: "monospace", textTransform: "uppercase" }} />
              </div>
              <div className="coupon-form-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Tipo *</label>
                  <select name="type" value={form.type} onChange={handleField}>
                    <option value="PERCENT">Percentual (%)</option>
                    <option value="FIXED">Valor fixo (R$)</option>
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Valor *</label>
                  <input name="value" type="number" min="0.01" step="0.01"
                    placeholder={form.type === "PERCENT" ? "ex: 10" : "ex: 20.00"}
                    value={form.value} onChange={handleField} />
                </div>
              </div>
              <div className="coupon-form-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Pedido mínimo (R$)</label>
                  <input name="minOrderAmount" type="number" min="0" step="0.01"
                    placeholder="Sem mínimo" value={form.minOrderAmount} onChange={handleField} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Limite de usos</label>
                  <input name="maxUsages" type="number" min="1" step="1"
                    placeholder="Ilimitado" value={form.maxUsages} onChange={handleField} />
                </div>
              </div>
              <div className="input-group">
                <label>Expira em</label>
                <input name="expiresAt" type="date" value={form.expiresAt} onChange={handleField} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? "Salvando…" : "Criar Cupom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="spinner">Carregando cupons…</div>
        ) : coupons.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "2rem 0", textAlign: "center" }}>
            Nenhum cupom cadastrado. Clique em "Novo Cupom" para criar.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Desconto</th>
                  <th>Pedido mín.</th>
                  <th>Usos</th>
                  <th>Expira em</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.04em" }}>{c.code}</td>
                    <td style={{ fontSize: "0.85rem" }}>{TYPE_LABELS[c.type]}</td>
                    <td style={{ fontWeight: 600 }}>
                      {c.type === "PERCENT" ? `${c.value}%` : formatBRL(c.value)}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{c.minOrderAmount ? formatBRL(c.minOrderAmount) : "—"}</td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {c.usedCount}{c.maxUsages ? ` / ${c.maxUsages}` : ""}
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{formatDate(c.expiresAt)}</td>
                    <td>
                      <span className={`badge ${c.active ? "badge-delivered" : "badge-cancelled"}`}>
                        {c.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title={c.active ? "Desativar" : "Ativar"}
                          onClick={() => handleToggle(c)}
                        >
                          {c.active ? <FaToggleOn style={{ color: "var(--success)" }} /> : <FaToggleOff />}
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Remover"
                          onClick={() => handleDelete(c.id)}
                          style={{ color: "var(--danger)" }}
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
    </div>
  );
}
