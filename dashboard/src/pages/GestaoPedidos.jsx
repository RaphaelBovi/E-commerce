import { useEffect, useState, useCallback } from "react";
import { FaEye, FaSearch, FaTimes } from "react-icons/fa";
import { getAllOrdersPaginated, updateOrderStatus } from "../services/ordersApi.js";
import "./GestaoPedidos.css";

const STATUS_LABELS = {
  PENDING_PAYMENT: "Aguardando Pagamento",
  PAID: "Pago",
  PREPARING: "Em Separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const STATUS_BADGE = {
  PENDING_PAYMENT: "badge-pending",
  PAID: "badge-paid",
  PREPARING: "badge-preparing",
  SHIPPED: "badge-shipped",
  DELIVERED: "badge-delivered",
  CANCELLED: "badge-cancelled",
};

const PAYMENT_LABELS = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  BOLETO: "Boleto",
};

const ALL_STATUSES = ["PENDING_PAYMENT","PAID","PREPARING","SHIPPED","DELIVERED","CANCELLED"];

const PAGE_SIZE = 20;

function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function GestaoPedidos() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [emailSearch, setEmailSearch]     = useState("");
  const [filterStatus, setFilter]         = useState("ALL");
  const [selected, setSelected]           = useState(null);
  const [updating, setUpdating]           = useState(false);
  const [newStatus, setNewStatus]         = useState("");
  const [trackingCode, setTrackingCode]   = useState("");
  const [trackingUrl, setTrackingUrl]     = useState("");
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    getAllOrdersPaginated(page, PAGE_SIZE, filterStatus === "ALL" ? "" : filterStatus, emailSearch)
      .then((data) => {
        setOrders(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, filterStatus, emailSearch]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (s) => { setFilter(s); setPage(0); };
  const handleSearch = (e) => { setEmailSearch(e.target.value); setPage(0); };

  const openDetail = (o) => {
    setSelected(o);
    setNewStatus(o.status);
    setTrackingCode(o.trackingCode || "");
    setTrackingUrl(o.trackingUrl || "");
  };

  const closeDetail = () => {
    setSelected(null);
    setNewStatus("");
    setTrackingCode("");
    setTrackingUrl("");
  };

  const handleUpdateStatus = async () => {
    if (!selected || newStatus === selected.status) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(selected.id, newStatus, trackingCode, trackingUrl);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelected(updated);
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Pedidos</h1>
          <p className="page-subtitle">{totalElements} pedidos no total</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          Atualizar
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="pedidos-toolbar">
          <div className="pedidos-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por e-mail do cliente…"
              value={emailSearch}
              onChange={handleSearch}
            />
            {emailSearch && (
              <button className="search-clear" onClick={() => { setEmailSearch(""); setPage(0); }}>
                <FaTimes />
              </button>
            )}
          </div>

          <div className="pedidos-filters">
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="ALL">Todos os status</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="spinner">Carregando pedidos…</div>
        ) : orders.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "2rem 0", textAlign: "center" }}>
            Nenhum pedido encontrado.
          </p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID do Pedido</th>
                    <th>Cliente</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        #{o.id?.slice(0, 8)}
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>{o.userEmail}</td>
                      <td style={{ fontSize: "0.85rem" }}>{PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod}</td>
                      <td style={{ fontWeight: 600 }}>{formatBRL(o.totalAmount)}</td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{formatDate(o.createdAt)}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[o.status] || ""}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => openDetail(o)}>
                          <FaEye /> Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                  <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>
                    {p + 1}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>›</button>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Pedido <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>#{selected.id?.slice(0, 8)}</span>
              </h2>
              <button className="modal-close" onClick={closeDetail}><FaTimes /></button>
            </div>

            <div className="order-detail-grid">
              <div className="order-detail-section">
                <h3 className="detail-label">Informações</h3>
                <div className="detail-row"><span>Cliente</span><strong>{selected.userEmail}</strong></div>
                <div className="detail-row"><span>Pagamento</span><strong>{PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod}</strong></div>
                <div className="detail-row"><span>Total</span><strong>{formatBRL(selected.totalAmount)}</strong></div>
                <div className="detail-row"><span>Data</span><strong>{formatDate(selected.createdAt)}</strong></div>
                {selected.trackingCode && (
                  <div className="detail-row">
                    <span>Rastreio</span>
                    <strong>
                      {selected.trackingUrl
                        ? <a href={selected.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>{selected.trackingCode}</a>
                        : selected.trackingCode}
                    </strong>
                  </div>
                )}
              </div>

              <div className="order-detail-section">
                <h3 className="detail-label">Endereço de Entrega</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text)" }}>{selected.deliveryAddress || "—"}</p>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <h3 className="detail-label" style={{ marginBottom: "0.75rem" }}>Itens do Pedido</h3>
              <table className="admin-table">
                <thead>
                  <tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {(selected.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          )}
                          <span style={{ fontSize: "0.875rem" }}>{item.productName}</span>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatBRL(item.unitPrice)}</td>
                      <td style={{ fontWeight: 600 }}>{formatBRL(Number(item.unitPrice) * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="update-status-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>Atualizar Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === selected.status}
              >
                {updating ? "Salvando…" : "Salvar Status"}
              </button>
            </div>

            {newStatus === "SHIPPED" && (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Código de Rastreio</label>
                  <input
                    type="text"
                    placeholder="ex: BR123456789BR"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ flex: 2 }}>
                  <label>URL de Rastreio</label>
                  <input
                    type="url"
                    placeholder="https://www.correios.com.br/rastreamento/..."
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
