import { useEffect, useState, useMemo } from "react";
import { FaEye, FaSearch, FaTimes } from "react-icons/fa";
import { getAllOrders, updateOrderStatus } from "../services/ordersApi.js";
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

function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const PAGE_SIZE = 10;

export default function GestaoPedidos() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("ALL");
  const [selected, setSelected]     = useState(null);
  const [updating, setUpdating]     = useState(false);
  const [newStatus, setNewStatus]   = useState("");
  const [page, setPage]             = useState(1);

  const load = () => {
    setLoading(true);
    getAllOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        o.id?.toLowerCase().includes(q) ||
        o.userEmail?.toLowerCase().includes(q) ||
        o.deliveryAddress?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (s) => { setFilter(s); setPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  const openDetail = (o) => { setSelected(o); setNewStatus(o.status); };
  const closeDetail = () => { setSelected(null); setNewStatus(""); };

  const handleUpdateStatus = async () => {
    if (!selected || newStatus === selected.status) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(selected.id, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelected(updated);
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const counts = useMemo(() => {
    const c = {};
    ALL_STATUSES.forEach((s) => { c[s] = orders.filter((o) => o.status === s).length; });
    return c;
  }, [orders]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Pedidos</h1>
          <p className="page-subtitle">{orders.length} pedidos no total</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          Atualizar
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {/* Toolbar */}
        <div className="pedidos-toolbar">
          <div className="pedidos-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por ID, e-mail ou endereço…"
              value={search}
              onChange={handleSearch}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}><FaTimes /></button>
            )}
          </div>
          <div className="pedidos-filters">
            <button
              className={`filter-pill ${filterStatus === "ALL" ? "active" : ""}`}
              onClick={() => handleFilterChange("ALL")}
            >
              Todos <span className="pill-count">{orders.length}</span>
            </button>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                className={`filter-pill filter-pill--${s.toLowerCase().replace("_", "-")} ${filterStatus === s ? "active" : ""}`}
                onClick={() => handleFilterChange(s)}
              >
                {STATUS_LABELS[s]} <span className="pill-count">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="spinner">Carregando pedidos…</div>
        ) : pageData.length === 0 ? (
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
                  {pageData.map((o) => (
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
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal detalhe */}
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
              {/* Info */}
              <div className="order-detail-section">
                <h3 className="detail-label">Informações</h3>
                <div className="detail-row"><span>Cliente</span><strong>{selected.userEmail}</strong></div>
                <div className="detail-row"><span>Pagamento</span><strong>{PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod}</strong></div>
                <div className="detail-row"><span>Total</span><strong>{formatBRL(selected.totalAmount)}</strong></div>
                <div className="detail-row"><span>Data</span><strong>{formatDate(selected.createdAt)}</strong></div>
                {selected.trackingCode && (
                  <div className="detail-row"><span>Rastreio</span><strong>{selected.trackingCode}</strong></div>
                )}
              </div>

              {/* Endereço */}
              <div className="order-detail-section">
                <h3 className="detail-label">Endereço de Entrega</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text)" }}>{selected.deliveryAddress || "—"}</p>
              </div>
            </div>

            {/* Itens */}
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

            {/* Atualizar status */}
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
          </div>
        </div>
      )}
    </div>
  );
}
