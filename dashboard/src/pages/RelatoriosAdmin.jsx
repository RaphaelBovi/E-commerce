import { useState, useEffect } from "react";
import {
  FaChartLine, FaShoppingCart, FaMoneyBillWave, FaTimesCircle,
  FaSpinner, FaBoxOpen, FaCalendarAlt,
} from "react-icons/fa";
import { getAdminSummary } from "../services/reportsApi.js";
import "./RelatoriosAdmin.css";

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtShort = (v) => {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R$${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
};

const STATUS_LABEL = {
  PENDING_PAYMENT: "Aguardando Pgto.",
  PAID:            "Pago",
  PREPARING:       "Em preparo",
  SHIPPED:         "Enviado",
  DELIVERED:       "Entregue",
  CANCELLED:       "Cancelado",
};

const PERIODS = [
  { label: "7 dias",    days: 7  },
  { label: "30 dias",   days: 30 },
  { label: "90 dias",   days: 90 },
  { label: "Personalizado", days: null },
];

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n + 1);
  return d;
}

// ── SVG área chart ────────────────────────────────────────────────
function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="ra-chart-empty">Sem receita registrada no período</div>;
  }

  const W = 600, H = 160, padX = 4, padY = 8;
  const maxVal = Math.max(...data.map((d) => Number(d.revenue)), 1);
  const n = data.length;

  const toX = (i) => padX + (n === 1 ? (W - padX * 2) / 2 : (i / (n - 1)) * (W - padX * 2));
  const toY = (v) => padY + (1 - Number(v) / maxVal) * (H - padY * 2);

  const pts = data.map((d, i) => [toX(i), toY(d.revenue)]);
  const polyline = pts.map((p) => p.join(",")).join(" ");
  const area =
    `M${pts[0][0]},${H} ` +
    pts.map((p) => `L${p[0]},${p[1]}`).join(" ") +
    ` L${pts[pts.length - 1][0]},${H} Z`;

  // X-axis labels: show at most 7 labels
  const step = Math.max(1, Math.ceil(n / 7));
  const labels = data.filter((_, i) => i % step === 0 || i === n - 1);

  return (
    <div className="ra-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="ra-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="raGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#raGrad)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--primary)" />
        ))}
      </svg>
      <div className="ra-chart-labels">
        {labels.map((d) => (
          <span key={d.date} className="ra-chart-label">
            {d.date.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="ra-kpi-card">
      <div className="ra-kpi-icon" style={{ background: `var(--${color}-soft)`, color: `var(--${color})` }}>
        {icon}
      </div>
      <div className="ra-kpi-body">
        <div className="ra-kpi-value">{value}</div>
        <div className="ra-kpi-label">{label}</div>
        {sub && <div className="ra-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function RelatoriosAdmin() {
  const [activePeriod, setActivePeriod] = useState(1); // 30 dias default
  const [customFrom, setCustomFrom]     = useState(toIso(daysAgo(30)));
  const [customTo, setCustomTo]         = useState(toIso(new Date()));
  const [data, setData]                 = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const getRange = () => {
    const period = PERIODS[activePeriod];
    if (period.days !== null) {
      return { from: toIso(daysAgo(period.days)), to: toIso(new Date()) };
    }
    return { from: customFrom, to: customTo };
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { from, to } = getRange();
      const res = await getAdminSummary(from, to);
      setData(res);
    } catch (e) {
      setError(e.message || "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activePeriod]);

  const cancelledCount = data?.ordersByStatus?.CANCELLED || 0;

  return (
    <div className="ra-page">
      <div className="ra-header">
        <div>
          <h1 className="ra-title"><FaChartLine /> Relatórios</h1>
          <p className="ra-subtitle">Análise de receita e pedidos</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="ra-period-bar">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            className={`ra-period-btn ${activePeriod === i ? "active" : ""}`}
            onClick={() => setActivePeriod(i)}
          >
            {p.label}
          </button>
        ))}
        {PERIODS[activePeriod].days === null && (
          <div className="ra-custom-range">
            <FaCalendarAlt />
            <input type="date" value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)} />
            <span>até</span>
            <input type="date" value={customTo}
              onChange={(e) => setCustomTo(e.target.value)} />
            <button className="ra-apply-btn" onClick={load}>Aplicar</button>
          </div>
        )}
      </div>

      {error && <div className="ra-error">{error}</div>}

      {loading && (
        <div className="ra-loading"><FaSpinner className="spin" /> Carregando…</div>
      )}

      {!loading && data && (
        <>
          {/* KPI cards */}
          <div className="ra-kpis">
            <KpiCard
              icon={<FaMoneyBillWave />}
              label="Receita Total"
              value={fmtShort(data.totalRevenue)}
              sub={fmt(data.totalRevenue)}
              color="success"
            />
            <KpiCard
              icon={<FaShoppingCart />}
              label="Total de Pedidos"
              value={data.totalOrders}
              color="primary"
            />
            <KpiCard
              icon={<FaChartLine />}
              label="Ticket Médio"
              value={fmt(data.avgOrderValue)}
              color="warning"
            />
            <KpiCard
              icon={<FaTimesCircle />}
              label="Cancelamentos"
              value={cancelledCount}
              color="danger"
            />
          </div>

          {/* Revenue chart */}
          <div className="ra-section">
            <h2 className="ra-section-title">Receita por dia</h2>
            <RevenueChart data={data.revenueByDay} />
          </div>

          {/* Status breakdown */}
          <div className="ra-section">
            <h2 className="ra-section-title">Pedidos por status</h2>
            <div className="ra-status-grid">
              {Object.entries(data.ordersByStatus || {}).map(([status, count]) => (
                <div key={status} className="ra-status-item">
                  <span className="ra-status-count">{count}</span>
                  <span className="ra-status-label">{STATUS_LABEL[status] || status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top products table */}
          <div className="ra-section">
            <h2 className="ra-section-title">Top 10 Produtos Mais Vendidos</h2>
            {data.topProducts.length === 0 ? (
              <p className="ra-empty">Nenhum produto vendido no período.</p>
            ) : (
              <div className="ra-table-wrap">
                <table className="ra-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Produto</th>
                      <th>Qtd. vendida</th>
                      <th>Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={p.productId || i}>
                        <td className="ra-rank">{i + 1}</td>
                        <td>
                          <div className="ra-product-name">
                            <FaBoxOpen className="ra-product-icon" />
                            {p.name}
                          </div>
                        </td>
                        <td className="ra-qty">{p.qtySold}</td>
                        <td className="ra-revenue">{fmt(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
