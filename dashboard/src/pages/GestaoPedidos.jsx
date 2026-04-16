// ─────────────────────────────────────────────────────────────────
// GestaoPedidos.jsx — Página de gestão de pedidos do painel
//
// Funcionalidades:
//   - Listar todos os pedidos com paginação (10 por página)
//   - Filtrar por status via pills clicáveis com contadores
//   - Buscar por ID do pedido, e-mail do cliente ou endereço
//   - Abrir modal de detalhes: informações, endereço, itens e status
//   - Atualizar o status de um pedido diretamente pelo modal
//
// Dados carregados via getAllOrders (ordersApi.js).
// Status atualizado via updateOrderStatus (ordersApi.js).
//
// Para adicionar um novo status:
//   1. Inclua o valor em ALL_STATUSES
//   2. Adicione a tradução em STATUS_LABELS
//   3. Adicione a classe CSS em STATUS_BADGE
//
// Para alterar o número de pedidos por página:
//   Mude o valor da constante PAGE_SIZE.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from "react";
import { FaEye, FaSearch, FaTimes } from "react-icons/fa";
import { getAllOrders, updateOrderStatus } from "../services/ordersApi.js";
import "./GestaoPedidos.css";

// Tradução dos status internos (inglês) para exibição em português.
const STATUS_LABELS = {
  PENDING_PAYMENT: "Aguardando Pagamento",
  PAID: "Pago",
  PREPARING: "Em Separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

// Classes CSS de badge para cada status — cores definidas em index.css.
const STATUS_BADGE = {
  PENDING_PAYMENT: "badge-pending",
  PAID: "badge-paid",
  PREPARING: "badge-preparing",
  SHIPPED: "badge-shipped",
  DELIVERED: "badge-delivered",
  CANCELLED: "badge-cancelled",
};

// Tradução dos métodos de pagamento para exibição ao usuário.
const PAYMENT_LABELS = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  BOLETO: "Boleto",
};

// Lista de todos os status possíveis — usada para gerar os pills de filtro
// e o dropdown de atualização de status no modal.
const ALL_STATUSES = ["PENDING_PAYMENT","PAID","PREPARING","SHIPPED","DELIVERED","CANCELLED"];

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

// Número de pedidos exibidos por página na tabela.
// Para alterar a paginação, mude este valor.
const PAGE_SIZE = 10;

export default function GestaoPedidos() {
  // Lista completa de pedidos retornada pela API
  const [orders, setOrders]         = useState([]);

  // Indica se os pedidos estão sendo carregados (exibe spinner)
  const [loading, setLoading]       = useState(true);

  // Mensagem de erro exibida no topo da página
  const [error, setError]           = useState("");

  // Texto digitado na barra de busca (filtra por ID, e-mail ou endereço)
  const [search, setSearch]         = useState("");

  // Status selecionado no filtro de pills ("ALL" = todos os status)
  const [filterStatus, setFilter]   = useState("ALL");

  // Pedido selecionado para exibir no modal de detalhes (null = fechado)
  const [selected, setSelected]     = useState(null);

  // Indica se a atualização de status está em andamento no modal
  const [updating, setUpdating]     = useState(false);

  // Novo status selecionado no dropdown dentro do modal de detalhes
  const [newStatus, setNewStatus]   = useState("");

  // Página atual da paginação (começa em 1)
  const [page, setPage]             = useState(1);

  // Carrega todos os pedidos da API.
  // Chamada na montagem do componente e também pelo botão "Atualizar".
  const load = () => {
    setLoading(true);
    getAllOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Executa load() uma única vez ao montar o componente.
  useEffect(() => { load(); }, []);

  // Lista de pedidos filtrada pelos filtros de status e busca de texto.
  // useMemo evita recalcular a cada renderização sem necessidade.
  // Recalcula apenas quando orders, filterStatus ou search mudam.
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // Filtra pelo status selecionado (ou todos se "ALL")
      const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
      const q = search.toLowerCase();
      // Filtra pelo texto de busca em ID, e-mail e endereço
      const matchSearch = !q ||
        o.id?.toLowerCase().includes(q) ||
        o.userEmail?.toLowerCase().includes(q) ||
        o.deliveryAddress?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, search]);

  // Cálculo da paginação com base na lista filtrada
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Fatia da lista filtrada correspondente à página atual
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Aplica o filtro de status e reinicia para a primeira página.
  const handleFilterChange = (s) => { setFilter(s); setPage(1); };

  // Atualiza o texto de busca e reinicia para a primeira página.
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  // Abre o modal de detalhes com o pedido selecionado.
  // Pré-define o dropdown de status com o status atual do pedido.
  const openDetail = (o) => { setSelected(o); setNewStatus(o.status); };

  // Fecha o modal de detalhes e limpa o pedido selecionado.
  const closeDetail = () => { setSelected(null); setNewStatus(""); };

  // Envia a atualização de status do pedido para a API.
  // Não faz nada se o status selecionado for igual ao atual.
  // Atualiza a lista local de pedidos com o retorno da API.
  const handleUpdateStatus = async () => {
    if (!selected || newStatus === selected.status) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(selected.id, newStatus);
      // Substitui o pedido atualizado na lista local sem recarregar tudo
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      // Atualiza o pedido exibido no modal com os dados retornados
      setSelected(updated);
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  // Contagem de pedidos por status — usada nos pills de filtro.
  // useMemo recalcula apenas quando a lista de pedidos muda.
  const counts = useMemo(() => {
    const c = {};
    ALL_STATUSES.forEach((s) => { c[s] = orders.filter((o) => o.status === s).length; });
    return c;
  }, [orders]);

  return (
    <div>
      {/* Cabeçalho com título, contador total e botão de atualização */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Pedidos</h1>
          <p className="page-subtitle">{orders.length} pedidos no total</p>
        </div>
        {/* Recarrega a lista de pedidos da API */}
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          Atualizar
        </button>
      </div>

      {/* Alerta de erro — exibido se a API falhar */}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {/* Barra de ferramentas: busca + pills de filtro por status */}
        <div className="pedidos-toolbar">
          {/* Campo de busca com ícone de lupa e botão de limpar */}
          <div className="pedidos-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por ID, e-mail ou endereço…"
              value={search}
              onChange={handleSearch}
            />
            {/* Botão "X" para limpar — aparece apenas quando há texto */}
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}><FaTimes /></button>
            )}
          </div>

          {/* Pills de filtro por status — cada um mostra a contagem de pedidos */}
          <div className="pedidos-filters">
            {/* Pill "Todos" — sem filtro de status */}
            <button
              className={`filter-pill ${filterStatus === "ALL" ? "active" : ""}`}
              onClick={() => handleFilterChange("ALL")}
            >
              Todos <span className="pill-count">{orders.length}</span>
            </button>
            {/* Pills individuais por status, com contagem */}
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

        {/* Área de conteúdo: spinner, estado vazio ou tabela com paginação */}
        {loading ? (
          <div className="spinner">Carregando pedidos…</div>
        ) : pageData.length === 0 ? (
          // Nenhum resultado com os filtros atuais
          <p style={{ color: "var(--text-secondary)", padding: "2rem 0", textAlign: "center" }}>
            Nenhum pedido encontrado.
          </p>
        ) : (
          <>
            {/* Tabela de pedidos com scroll horizontal em telas pequenas */}
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
                    <th></th> {/* Coluna do botão de detalhes */}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((o) => (
                    <tr key={o.id}>
                      {/* ID abreviado — 8 primeiros caracteres do UUID */}
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        #{o.id?.slice(0, 8)}
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>{o.userEmail}</td>
                      {/* Método de pagamento traduzido */}
                      <td style={{ fontSize: "0.85rem" }}>{PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod}</td>
                      <td style={{ fontWeight: 600 }}>{formatBRL(o.totalAmount)}</td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{formatDate(o.createdAt)}</td>
                      {/* Badge colorido com o status atual do pedido */}
                      <td>
                        <span className={`badge ${STATUS_BADGE[o.status] || ""}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      {/* Botão para abrir o modal de detalhes do pedido */}
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

            {/* Controles de paginação — exibidos apenas quando há mais de 1 página */}
            {totalPages > 1 && (
              <div className="pagination">
                {/* Botão de página anterior */}
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                {/* Botões numerados de cada página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
                ))}
                {/* Botão de próxima página */}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalhes do pedido — abre ao clicar em "Detalhes".
          Clicando no overlay escuro, o modal fecha. */}
      {selected && (
        <div className="modal-overlay" onClick={closeDetail}>
          {/* stopPropagation impede que clicar dentro do modal o feche */}
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {/* Título com o ID abreviado do pedido */}
              <h2 className="modal-title">
                Pedido <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>#{selected.id?.slice(0, 8)}</span>
              </h2>
              <button className="modal-close" onClick={closeDetail}><FaTimes /></button>
            </div>

            {/* Grid de 2 colunas com informações gerais e endereço de entrega */}
            <div className="order-detail-grid">
              {/* Seção de informações do pedido */}
              <div className="order-detail-section">
                <h3 className="detail-label">Informações</h3>
                <div className="detail-row"><span>Cliente</span><strong>{selected.userEmail}</strong></div>
                <div className="detail-row"><span>Pagamento</span><strong>{PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod}</strong></div>
                <div className="detail-row"><span>Total</span><strong>{formatBRL(selected.totalAmount)}</strong></div>
                <div className="detail-row"><span>Data</span><strong>{formatDate(selected.createdAt)}</strong></div>
                {/* Código de rastreio — exibido apenas se disponível */}
                {selected.trackingCode && (
                  <div className="detail-row"><span>Rastreio</span><strong>{selected.trackingCode}</strong></div>
                )}
              </div>

              {/* Seção com o endereço de entrega */}
              <div className="order-detail-section">
                <h3 className="detail-label">Endereço de Entrega</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text)" }}>{selected.deliveryAddress || "—"}</p>
              </div>
            </div>

            {/* Tabela com os itens do pedido: produto, quantidade, preço unitário e subtotal */}
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
                        {/* Miniatura da imagem do produto + nome */}
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
                      {/* Subtotal = preço unitário × quantidade */}
                      <td style={{ fontWeight: 600 }}>{formatBRL(Number(item.unitPrice) * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Área de atualização de status do pedido.
                O botão fica desabilitado enquanto o status não mudar ou durante o envio. */}
            <div className="update-status-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>Atualizar Status</label>
                {/* Dropdown com todos os status possíveis */}
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleUpdateStatus}
                // Desabilitado se: ainda salvando OU o status não mudou
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
