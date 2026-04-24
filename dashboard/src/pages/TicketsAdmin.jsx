import { useState, useEffect } from 'react';
import {
  FaHeadset, FaSearch, FaFilter, FaTimes, FaArrowLeft,
  FaPaperPlane, FaTrash, FaCheckCircle, FaClock, FaExclamationCircle,
} from 'react-icons/fa';
import {
  fetchAllTickets, fetchTicket, replyTicket,
  updateTicketStatus, deleteTicket,
  TICKET_STATUS_LABELS, TICKET_STATUS_OPTIONS,
} from '../services/ticketsApi';
import './TicketsAdmin.css';

// ─── Status config ─────────────────────────────────────────────────
const STATUS_STYLE = {
  OPEN:              { cls: 'ta-badge--open',     icon: <FaExclamationCircle /> },
  IN_PROGRESS:       { cls: 'ta-badge--progress', icon: <FaClock /> },
  AWAITING_RESPONSE: { cls: 'ta-badge--waiting',  icon: <FaClock /> },
  CLOSED:            { cls: 'ta-badge--closed',   icon: <FaCheckCircle /> },
};

function StatusBadge({ status }) {
  const cfg = STATUS_STYLE[status] || {};
  return (
    <span className={`ta-status-badge ${cfg.cls || ''}`}>
      {cfg.icon} {TICKET_STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Main ─────────────────────────────────────────────────────────
export default function TicketsAdmin() {
  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [detailLoading, setDL]        = useState(false);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilter]     = useState('');
  const [reply, setReply]             = useState('');
  const [sending, setSending]         = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirm]   = useState(false);
  const [statusUpdating, setStatUpd]  = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try { setTickets(await fetchAllTickets()); }
    catch {}
    finally { setLoading(false); }
  }

  async function openTicket(ticket) {
    setDL(true);
    setSelected(null);
    setReply('');
    setConfirm(false);
    try {
      const full = await fetchTicket(ticket.id);
      setSelected(full);
    } catch {
      setSelected(ticket);
    } finally {
      setDL(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const updated = await replyTicket(selected.id, reply);
      setSelected(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setReply('');
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  }

  async function handleStatusChange(newStatus) {
    setStatUpd(true);
    try {
      const updated = await updateTicketStatus(selected.id, newStatus);
      setSelected(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) { alert(err.message); }
    finally { setStatUpd(false); }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirm(true); return; }
    setDeleting(true);
    try {
      await deleteTicket(selected.id);
      setTickets((prev) => prev.filter((t) => t.id !== selected.id));
      setSelected(null);
      setConfirm(false);
    } catch (err) { alert(err.message); }
    finally { setDeleting(false); }
  }

  // Filter logic
  const filtered = tickets.filter((t) => {
    const matchSearch = !search ||
      t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = TICKET_STATUS_OPTIONS.reduce((acc, { value }) => {
    acc[value] = tickets.filter((t) => t.status === value).length;
    return acc;
  }, {});

  return (
    <div className="ta-page">

      {/* ── Header ── */}
      <div className="ta-header">
        <div className="ta-header-left">
          <FaHeadset className="ta-header-icon" aria-hidden />
          <div>
            <h1 className="ta-title">Tickets de Suporte</h1>
            <p className="ta-subtitle">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} no total</p>
          </div>
        </div>
        <div className="ta-header-stats">
          {TICKET_STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              className={`ta-stat-pill ${filterStatus === value ? 'ta-stat-pill--active' : ''}`}
              onClick={() => setFilter((f) => (f === value ? '' : value))}
            >
              <span className={`ta-stat-dot ta-stat-dot--${value.toLowerCase().replace('_', '-')}`} />
              {label} <strong>{counts[value]}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="ta-layout">

        {/* ── Ticket list ── */}
        <div className="ta-list-panel">
          {/* Search */}
          <div className="ta-search-bar">
            <FaSearch className="ta-search-icon" aria-hidden />
            <input
              type="text"
              placeholder="Buscar por número, assunto ou e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ta-search-input"
            />
            {search && (
              <button className="ta-search-clear" onClick={() => setSearch('')}>
                <FaTimes />
              </button>
            )}
          </div>

          {loading ? (
            <div className="ta-list-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ta-skeleton" aria-hidden />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ta-list-empty">
              <FaHeadset aria-hidden />
              <p>Nenhum ticket encontrado</p>
            </div>
          ) : (
            <div className="ta-list">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  className={`ta-list-item${selected?.id === t.id ? ' ta-list-item--active' : ''}`}
                  onClick={() => openTicket(t)}
                >
                  <div className="ta-item-top">
                    <span className="ta-item-number">{t.ticketNumber}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="ta-item-subject">{t.subject}</p>
                  <div className="ta-item-meta">
                    <span className="ta-item-email">{t.userEmail}</span>
                    <span className="ta-item-date">{formatDate(t.updatedAt)}</span>
                  </div>
                  <span className="ta-item-cat">{t.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Detail panel ── */}
        <div className="ta-detail-panel">
          {detailLoading && (
            <div className="ta-detail-loading">
              <div className="ta-detail-skeleton" aria-hidden />
            </div>
          )}

          {!detailLoading && !selected && (
            <div className="ta-detail-empty">
              <FaHeadset className="ta-detail-empty-icon" aria-hidden />
              <p>Selecione um ticket para ver os detalhes</p>
            </div>
          )}

          {!detailLoading && selected && (
            <div className="ta-detail">
              {/* Header */}
              <div className="ta-detail-header">
                <div className="ta-detail-info">
                  <span className="ta-item-number">{selected.ticketNumber}</span>
                  <h2 className="ta-detail-subject">{selected.subject}</h2>
                  <div className="ta-detail-meta">
                    <StatusBadge status={selected.status} />
                    <span className="ta-detail-user">
                      {selected.userName} ({selected.userEmail})
                    </span>
                    <span className="ta-detail-cat">{selected.category}</span>
                  </div>
                  <p className="ta-detail-dates">
                    Aberto em {formatDate(selected.createdAt)} · Atualizado em {formatDate(selected.updatedAt)}
                  </p>
                </div>
                <div className="ta-detail-actions">
                  {/* Status selector */}
                  <select
                    className="ta-status-select"
                    value={selected.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                  >
                    {TICKET_STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {/* Delete */}
                  {confirmDelete ? (
                    <div className="ta-confirm-delete">
                      <span>Confirmar exclusão?</span>
                      <button
                        className="ta-delete-confirm-btn"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? 'Excluindo…' : 'Sim, excluir'}
                      </button>
                      <button className="ta-cancel-btn" onClick={() => setConfirm(false)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button className="ta-delete-btn" onClick={handleDelete}>
                      <FaTrash /> Excluir
                    </button>
                  )}
                </div>
              </div>

              {/* Conversation */}
              <div className="ta-conversation">
                {selected.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ta-msg${msg.authorRole === 'SUPPORT' ? ' ta-msg--support' : ' ta-msg--customer'}`}
                  >
                    <div className="ta-msg-avatar">
                      {msg.authorRole === 'SUPPORT'
                        ? <FaHeadset />
                        : msg.authorName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="ta-msg-body">
                      <div className="ta-msg-author">
                        <strong>
                          {msg.authorRole === 'SUPPORT' ? 'Suporte' : msg.authorName}
                        </strong>
                        <span className="ta-msg-time">{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="ta-msg-content">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply form */}
              <form className="ta-reply-form" onSubmit={handleReply}>
                <textarea
                  className="ta-reply-textarea"
                  rows={3}
                  placeholder="Escreva sua resposta ao cliente…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  disabled={sending}
                />
                <div className="ta-reply-footer">
                  <small className="ta-char-count">{reply.length}/4000</small>
                  <button
                    type="submit"
                    className="ta-send-btn"
                    disabled={sending || !reply.trim()}
                  >
                    <FaPaperPlane /> {sending ? 'Enviando…' : 'Responder'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
