// ─────────────────────────────────────────────────────────────────
// NotasFiscais.jsx — Página de notas fiscais do painel administrativo
//
// Exibe as notas fiscais geradas automaticamente para todos os pedidos
// com status "DELIVERED" (Entregue). Cada nota recebe um número sequencial
// no formato NF-ANO-SEQUÊNCIA (ex: NF-2026-00001).
//
// Funcionalidades atuais:
//   - Carrega pedidos entregues via getAllOrders (ordersApi.js)
//   - Gera número de nota fiscal local (sem persistência no backend)
//   - Lista as notas com número, pedido, cliente, data, valor e status
//   - Botão de PDF presente, mas desabilitado (funcionalidade futura)
//
// Limitações (versões futuras):
//   - Emissão oficial via SEFAZ não está implementada
//   - Geração de PDF não está disponível ainda
//
// Para adicionar filtros (ex: por data ou cliente):
//   1. Adicione estados de filtro com useState
//   2. Filtre a lista "invoices" com useMemo antes de renderizar
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { FaFileInvoice, FaFilePdf } from "react-icons/fa";
import { getAllOrders } from "../services/ordersApi.js";
import "./NotasFiscais.css";

// Formata um número como moeda brasileira (R$).
function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Formata uma string ISO de data para data e hora legíveis em pt-BR.
// Retorna "—" para valores nulos ou indefinidos.
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Gera o número de nota fiscal no formato NF-ANO-SEQUÊNCIA.
// O número é baseado na posição do pedido na lista (index + 1),
// com zero à esquerda para 5 dígitos (ex: NF-2026-00001).
// Nota: este número é gerado localmente e não persiste no backend.
// Para persistência real, o backend deve gerar e armazenar o número.
function buildInvoiceNumber(orderId, index) {
  const year = new Date().getFullYear();
  const seq  = String(index + 1).padStart(5, "0");
  return `NF-${year}-${seq}`;
}

export default function NotasFiscais() {
  // Lista de pedidos entregues carregados da API
  const [orders, setOrders]   = useState([]);

  // Indica se os dados ainda estão sendo carregados (exibe spinner)
  const [loading, setLoading] = useState(true);

  // Mensagem de erro caso a requisição à API falhe
  const [error, setError]     = useState("");

  // Carrega todos os pedidos ao montar o componente e filtra apenas os entregues.
  // Array de dependências vazio [] = executa uma única vez na montagem.
  useEffect(() => {
    getAllOrders()
      .then((all) => setOrders(all.filter((o) => o.status === "DELIVERED"))) // Apenas pedidos entregues
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Mapeia os pedidos entregues adicionando o número de nota fiscal gerado.
  // invoices é recalculado toda vez que orders muda.
  const invoices = orders.map((o, i) => ({
    ...o,                                          // Todos os campos originais do pedido
    invoiceNumber: buildInvoiceNumber(o.id, i),   // Número da nota gerado localmente
  }));

  return (
    <div>
      {/* Cabeçalho com título e contagem de notas geradas */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notas Fiscais</h1>
          {/* Exibe "—" enquanto carrega e o total ao concluir */}
          <p className="page-subtitle">{loading ? "—" : `${invoices.length} notas geradas`}</p>
        </div>
      </div>

      {/* Alerta de erro — exibido se a API falhar */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Aviso informativo sobre o funcionamento das notas fiscais.
          Explica que a emissão oficial via SEFAZ está prevista para versões futuras. */}
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
          // Indicador de carregamento
          <div className="spinner">Carregando notas…</div>
        ) : invoices.length === 0 ? (
          // Estado vazio: ainda não há pedidos entregues
          <p style={{ color: "var(--text-secondary)", padding: "2rem 0", textAlign: "center" }}>
            Nenhuma nota fiscal gerada. Pedidos entregues aparecerão aqui.
          </p>
        ) : (
          // Tabela de notas fiscais com scroll horizontal em telas pequenas
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
                  <th></th> {/* Coluna do botão de PDF */}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    {/* Número da nota fiscal gerado (NF-ANO-SEQUÊNCIA) */}
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    {/* ID abreviado do pedido original */}
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      #{inv.id?.slice(0, 8)}
                    </td>
                    {/* E-mail do cliente */}
                    <td style={{ fontSize: "0.875rem" }}>{inv.userEmail}</td>
                    {/* Data de criação do pedido */}
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{formatDate(inv.createdAt)}</td>
                    {/* Valor total do pedido formatado em R$ */}
                    <td style={{ fontWeight: 600 }}>{formatBRL(inv.totalAmount)}</td>
                    {/* Badge verde "Emitida" para todas as notas desta lista */}
                    <td><span className="badge badge-delivered">Emitida</span></td>
                    {/* Botão de PDF — desabilitado aguardando implementação futura */}
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
