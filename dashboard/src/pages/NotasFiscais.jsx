import { useEffect, useState } from "react";
import { FaFileInvoice, FaFilePdf } from "react-icons/fa";
import { getAllOrders } from "../services/ordersApi.js";
import "./NotasFiscais.css";

function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function buildInvoiceNumber(orderId, index) {
  const year = new Date().getFullYear();
  const seq  = String(index + 1).padStart(5, "0");
  return `NF-${year}-${seq}`;
}

export default function NotasFiscais() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getAllOrders()
      .then((all) => setOrders(all.filter((o) => o.status === "DELIVERED")))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const invoices = orders.map((o, i) => ({
    ...o,
    invoiceNumber: buildInvoiceNumber(o.id, i),
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notas Fiscais</h1>
          <p className="page-subtitle">{loading ? "—" : `${invoices.length} notas geradas`}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="notas-notice">
        <FaFileInvoice />
        <span>
          As notas fiscais são geradas automaticamente para pedidos com status
          <strong> Entregue</strong>. A emissão oficial via SEFAZ está prevista para
          versões futuras.
        </span>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner">Carregando notas…</div>
        ) : invoices.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "2rem 0", textAlign: "center" }}>
            Nenhuma nota fiscal gerada. Pedidos entregues aparecerão aqui.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nº da Nota</th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      #{inv.id?.slice(0, 8)}
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>{inv.userEmail}</td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{formatDate(inv.createdAt)}</td>
                    <td style={{ fontWeight: 600 }}>{formatBRL(inv.totalAmount)}</td>
                    <td><span className="badge badge-delivered">Emitida</span></td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        disabled
                        title="Geração de PDF disponível em breve"
                      >
                        <FaFilePdf /> PDF
                      </button>
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
