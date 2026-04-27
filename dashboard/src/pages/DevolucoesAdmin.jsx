import { useEffect, useState } from "react";
import { FaUndoAlt, FaCheck, FaTimes } from "react-icons/fa";
import { apiFetch } from "../services/apiClient.js";

const STATUS_LABELS = { PENDING: "Pendente", APPROVED: "Aprovada", REJECTED: "Rejeitada" };
const STATUS_COLORS = { PENDING: "badge-pending", APPROVED: "badge-paid", REJECTED: "badge-cancelled" };
const REASON_LABELS = {
  DEFECTIVE: "Produto com defeito",
  WRONG_ITEM: "Produto errado",
  CHANGED_MIND: "Mudou de ideia",
  DAMAGED_SHIPPING: "Danificado no transporte",
  OTHER: "Outro",
};

function fmt(d) {
  return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
}

export default function DevolucoesAdmin() {
  const [returns, setReturns]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [notesMap, setNotesMap] = useState({});
  const [saving, setSaving]     = useState(null);

  const load = () => {
    setLoading(true);
    apiFetch("/returns/admin")
      .then(setReturns)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleStatus = async (id, status) => {
    setSaving(id + status);
    try {
      const updated = await apiFetch(`/returns/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes: notesMap[id] || null }),
      });
      setReturns((prev) => prev.map((r) => (r.id === id ? updated : r)));
      flash(`Solicitação ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const pending   = returns.filter((r) => r.status === "PENDING").length;
  const approved  = returns.filter((r) => r.status === "APPROVED").length;
  const rejected  = returns.filter((r) => r.status === "REJECTED").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Devoluções</h1>
          <p className="page-subtitle">
            {returns.length} solicitação{returns.length !== 1 ? "ões" : ""}
            {pending > 0 && <> · <span style={{ color: "var(--warning)" }}>{pending} pendente{pending !== 1 ? "s" : ""}</span></>}
          </p>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[{ label: "Pendentes", val: pending, color: "var(--warning)" },
          { label: "Aprovadas",  val: approved, color: "var(--success)" },
          { label: "Rejeitadas", val: rejected, color: "var(--danger)" }].map((kpi) => (
          <div key={kpi.label} className="card" style={{ flex: "1 1 120px", padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: kpi.color }}>{kpi.val}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner">Carregando…</div>
        ) : returns.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "2rem", textAlign: "center" }}>
            Nenhuma solicitação de devolução.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Motivo</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Obs. Admin</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      #{r.orderId?.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>{REASON_LABELS[r.reason] ?? r.reason}</td>
                    <td style={{ fontSize: "0.82rem" }}>{fmt(r.createdAt)}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td>
                      {r.status === "PENDING" ? (
                        <input
                          type="text"
                          placeholder="Observação (opcional)"
                          value={notesMap[r.id] || ""}
                          onChange={(e) => setNotesMap((m) => ({ ...m, [r.id]: e.target.value }))}
                          style={{ width: "100%", minWidth: 140, padding: "0.3rem 0.5rem",
                            border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                            fontSize: "0.8rem", background: "var(--surface-2)" }}
                        />
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {r.adminNotes || "—"}
                        </span>
                      )}
                    </td>
                    <td>
                      {r.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: "var(--success)", color: "#fff", border: "none" }}
                            onClick={() => handleStatus(r.id, "APPROVED")}
                            disabled={saving === r.id + "APPROVED"}
                            title="Aprovar"
                          >
                            <FaCheck />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStatus(r.id, "REJECTED")}
                            disabled={saving === r.id + "REJECTED"}
                            title="Rejeitar"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>—</span>
                      )}
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
