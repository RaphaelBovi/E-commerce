import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { FaClipboardList, FaCheckCircle, FaClock, FaBoxOpen } from "react-icons/fa";
import { getAllOrders } from "../services/ordersApi.js";
import "./DashboardHome.css";

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

function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildChartData(orders) {
  const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const total = orders
      .filter((o) => {
        const c = new Date(o.createdAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth() && o.status !== "CANCELLED";
      })
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    return { month: names[d.getMonth()], total };
  });
}

export default function DashboardHome() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getAllOrders().then(setOrders).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const pending   = orders.filter((o) => ["PENDING_PAYMENT","PAID","PREPARING"].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const revenue   = orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const recent    = orders.slice(0, 8);
  const chartData = buildChartData(orders);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral da operação</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-4 dash-stats">
        {[
          { icon: <FaClipboardList />, value: orders.length, label: "Total de Pedidos", bg: "#eff6ff", color: "#2563eb" },
          { icon: <FaClock />, value: pending, label: "Em Andamento", bg: "#fef3c7", color: "#92400e" },
          { icon: <FaCheckCircle />, value: delivered, label: "Entregues", bg: "#d1fae5", color: "#065f46" },
          { icon: <FaBoxOpen />, value: formatBRL(revenue), label: "Receita Total", bg: "#ede9fe", color: "#5b21b6", small: true },
        ].map((s, i) => (
          <div key={i} className="card stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className={`stat-value ${s.small ? "stat-value--sm" : ""}`}>{loading ? "—" : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-bottom">
        <div className="card dash-chart">
          <h2 className="dash-section-title">Receita — últimos 6 meses</h2>
          {loading ? <div className="spinner">Carregando…</div> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatBRL(v), "Receita"]} contentStyle={{ border: "1px solid var(--border)", borderRadius: "8px" }} />
                <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card dash-recent">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Pedidos Recentes</h2>
            <button className="btn btn-outline btn-sm" onClick={() => navigate("/pedidos")}>Ver todos</button>
          </div>
          {loading ? <div className="spinner">Carregando…</div> : recent.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", padding: "1rem 0" }}>Nenhum pedido registrado.</p>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => navigate("/pedidos")}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>#{o.id?.slice(0, 8)}</td>
                    <td style={{ fontSize: "0.85rem" }}>{o.userEmail}</td>
                    <td style={{ fontWeight: 600 }}>{formatBRL(o.totalAmount)}</td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || ""}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
