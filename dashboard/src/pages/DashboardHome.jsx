// ─────────────────────────────────────────────────────────────────
// DashboardHome.jsx — Página inicial do painel administrativo
//
// Exibe uma visão geral da operação com:
//   - 4 cartões de estatísticas: total de pedidos, em andamento,
//     entregues e receita total (excluindo cancelados)
//   - Gráfico de barras com a receita dos últimos 6 meses (Recharts)
//   - Tabela com os 8 pedidos mais recentes
//
// Todos os dados vêm da API via getAllOrders (serviço ordersApi.js).
// Os cálculos de métricas são feitos no front com os dados recebidos.
//
// Para adicionar um novo cartão de estatística:
//   Inclua um novo objeto no array passado ao .map() dentro de "dash-stats".
//
// Para adicionar novas colunas ao gráfico ou mudar o período:
//   Edite a função buildChartData().
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { FaClipboardList, FaCheckCircle, FaClock, FaBoxOpen } from "react-icons/fa";
import { getAllOrders } from "../services/ordersApi.js";
import "./DashboardHome.css";

// Mapeamento de status internos (inglês) para rótulos exibidos em português.
// Para adicionar um novo status, inclua uma entrada aqui e em STATUS_BADGE.
const STATUS_LABELS = {
  PENDING_PAYMENT: "Aguardando Pagamento",
  PAID: "Pago",
  PREPARING: "Em Separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

// Mapeamento de status para classes CSS de badge (cores de fundo/texto).
// As classes são definidas em index.css.
const STATUS_BADGE = {
  PENDING_PAYMENT: "badge-pending",
  PAID: "badge-paid",
  PREPARING: "badge-preparing",
  SHIPPED: "badge-shipped",
  DELIVERED: "badge-delivered",
  CANCELLED: "badge-cancelled",
};

// Formata um número como moeda brasileira (R$).
// Exemplo: 1500 → "R$ 1.500,00"
function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Constrói os dados do gráfico de barras com a receita dos últimos 6 meses.
// Para cada mês, soma o totalAmount de pedidos não cancelados.
// Retorna um array de { month: "Jan", total: 12345.67 }.
// Para alterar o número de meses exibidos, mude o "6" em Array.from({ length: 6 }).
function buildChartData(orders) {
  const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    // Calcula o mês correspondente (de 5 meses atrás até o mês atual)
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const total = orders
      .filter((o) => {
        const c = new Date(o.createdAt);
        // Filtra pedidos do mesmo mês/ano, excluindo cancelados
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth() && o.status !== "CANCELLED";
      })
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    return { month: names[d.getMonth()], total };
  });
}

export default function DashboardHome() {
  // Lista completa de pedidos retornada pela API
  const [orders, setOrders] = useState([]);

  // Indica se os dados ainda estão sendo carregados (exibe "—" nos cards)
  const [loading, setLoading] = useState(true);

  // Mensagem de erro caso a requisição falhe
  const [error, setError] = useState("");

  const navigate = useNavigate(); // Usado para navegar para "/pedidos" ao clicar na tabela

  // Carrega todos os pedidos ao montar o componente (array de dependências vazio = executa uma vez).
  // Atualiza o estado orders com os dados ou exibe o erro em caso de falha.
  useEffect(() => {
    getAllOrders().then(setOrders).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  // Métricas calculadas a partir da lista de pedidos:
  // Pedidos "em andamento" = aguardando pagamento, pagos ou em separação
  const pending   = orders.filter((o) => ["PENDING_PAYMENT","PAID","PREPARING"].includes(o.status)).length;
  // Total de pedidos entregues com sucesso
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  // Receita total: soma os valores de todos os pedidos não cancelados
  const revenue   = orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  // Os 8 pedidos mais recentes para a tabela de resumo
  const recent    = orders.slice(0, 8);
  // Dados formatados para o gráfico de barras
  const chartData = buildChartData(orders);

  return (
    <div>
      {/* Cabeçalho da página com título e subtítulo */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral da operação</p>
        </div>
      </div>

      {/* Alerta de erro — exibido apenas se a API retornar falha */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Grade com 4 cartões de estatísticas.
          Cada cartão exibe um ícone colorido, o valor calculado e um rótulo.
          Para adicionar um novo cartão, insira um objeto no array abaixo. */}
      <div className="grid-4 dash-stats">
        {[
          { icon: <FaClipboardList />, value: orders.length, label: "Total de Pedidos", bg: "#eff6ff", color: "#2563eb" },
          { icon: <FaClock />, value: pending, label: "Em Andamento", bg: "#fef3c7", color: "#92400e" },
          { icon: <FaCheckCircle />, value: delivered, label: "Entregues", bg: "#d1fae5", color: "#065f46" },
          { icon: <FaBoxOpen />, value: formatBRL(revenue), label: "Receita Total", bg: "#ede9fe", color: "#5b21b6", small: true },
        ].map((s, i) => (
          // Cada cartão é um card com ícone, valor e rótulo
          <div key={i} className="card stat-card">
            {/* Ícone com fundo e cor personalizados por tipo de métrica */}
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            {/* Valor numérico — "—" enquanto carrega; stat-value--sm para textos mais longos (ex: R$) */}
            <div className={`stat-value ${s.small ? "stat-value--sm" : ""}`}>{loading ? "—" : s.value}</div>
            {/* Rótulo descritivo abaixo do valor */}
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Seção inferior: gráfico à esquerda, tabela de pedidos recentes à direita */}
      <div className="dash-bottom">

        {/* Gráfico de barras — receita dos últimos 6 meses */}
        <div className="card dash-chart">
          <h2 className="dash-section-title">Receita — últimos 6 meses</h2>
          {loading ? <div className="spinner">Carregando…</div> : (
            // ResponsiveContainer garante que o gráfico se adapta ao tamanho do contêiner
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={26}>
                {/* Grade de fundo do gráfico */}
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                {/* Eixo X com os nomes abreviados dos meses */}
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                {/* Eixo Y com valores em R$ mil (ex: R$12k) */}
                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                {/* Tooltip exibido ao passar o mouse sobre cada barra */}
                <Tooltip formatter={(v) => [formatBRL(v), "Receita"]} contentStyle={{ border: "1px solid var(--border)", borderRadius: "8px" }} />
                {/* Barras com cantos arredondados no topo */}
                <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabela com os 8 pedidos mais recentes */}
        <div className="card dash-recent">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Pedidos Recentes</h2>
            {/* Botão que navega para a página completa de pedidos */}
            <button className="btn btn-outline btn-sm" onClick={() => navigate("/pedidos")}>Ver todos</button>
          </div>

          {loading ? <div className="spinner">Carregando…</div> : recent.length === 0 ? (
            // Estado vazio: nenhum pedido registrado ainda
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", padding: "1rem 0" }}>Nenhum pedido registrado.</p>
          ) : (
            // Tabela de pedidos recentes — clicável, navega para /pedidos
            <table className="admin-table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  // Cada linha é clicável e leva à página de pedidos completa
                  <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => navigate("/pedidos")}>
                    {/* ID abreviado do pedido (8 primeiros caracteres) */}
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>#{o.id?.slice(0, 8)}</td>
                    {/* E-mail do cliente */}
                    <td style={{ fontSize: "0.85rem" }}>{o.userEmail}</td>
                    {/* Valor total formatado em R$ */}
                    <td style={{ fontWeight: 600 }}>{formatBRL(o.totalAmount)}</td>
                    {/* Badge colorido com o status do pedido */}
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
