import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaUser, FaBoxOpen, FaMapMarkerAlt, FaHeart, FaHeadset,
  FaBell, FaCog, FaSignOutAlt, FaChevronRight, FaArrowLeft,
  FaShoppingBag, FaCheckCircle, FaTruck, FaTimesCircle, FaClock,
  FaCreditCard, FaLock, FaEdit, FaSave, FaTimes, FaWrench,
  FaPlus, FaComments, FaChevronDown, FaPaperPlane, FaTag,
} from 'react-icons/fa';
import { useAuth } from '../context/useAuth';
import { getMyOrders, cancelMyOrder, getOrderTracking } from '../services/ordersApi';
import { createReturn } from '../services/returnsApi';
import { getUserProfile, updateProfile, changePassword, deleteAccount } from '../services/authApi';
import { fetchFavorites, toggleFavorite } from '../services/favoritesApi';
import {
  fetchMyTickets, fetchMyTicket, createTicket, replyTicket,
  TICKET_STATUS_LABELS, TICKET_CATEGORIES,
} from '../services/ticketsApi';
import Breadcrumb from '../components/Breadcrumb';
import './MinhaConta.css';

// ─── Constants ────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: 'Aguardando Pagamento', color: 'status-warning', Icon: FaClock },
  PAID:            { label: 'Pago',                 color: 'status-info',    Icon: FaCheckCircle },
  PREPARING:       { label: 'Em Separação',         color: 'status-purple',  Icon: FaBoxOpen },
  SHIPPED:         { label: 'Enviado',              color: 'status-blue',    Icon: FaTruck },
  DELIVERED:       { label: 'Entregue',             color: 'status-success', Icon: FaCheckCircle },
  CANCELLED:       { label: 'Cancelado',            color: 'status-danger',  Icon: FaTimesCircle },
};

const PAYMENT_LABELS = {
  PIX:         'Pix',
  CREDIT_CARD: 'Cartão de Crédito',
  BOLETO:      'Boleto',
  DEBIT_CARD:  'Cartão de Débito',
};

const TIMELINE_STEPS = ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

// ─── Helpers ──────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatShortDate(d) {
  if (!d) return '—';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
  }
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}

function formatPhone(v) {
  if (!v) return '—';
  const d = v.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return v;
}

function formatZip(v) {
  if (!v) return '—';
  const d = v.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0,5)}-${d.slice(5)}` : v;
}

// ─── Toast ────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`mc-toast mc-toast-${type}`}>
      {type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
      <span>{message}</span>
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────

function OrderCard({ order, onView }) {
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'status-info' };
  const count = order.items?.length ?? 0;
  return (
    <div className="mc-order-card">
      <div className="mc-order-card-header">
        <div className="mc-order-card-id"><FaBoxOpen /><span>Pedido #{order.id.slice(-8).toUpperCase()}</span></div>
        <span className={`mc-badge ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="mc-order-card-meta">
        <span>{formatDate(order.createdAt)}</span>
        <span>·</span>
        <span>{count} {count === 1 ? 'produto' : 'produtos'}</span>
        <span>·</span>
        <span>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
      </div>
      <div className="mc-order-card-footer">
        <strong className="mc-order-total-value">{formatCurrency(order.totalAmount)}</strong>
        <button className="mc-view-btn" onClick={onView}>Ver detalhes →</button>
      </div>
    </div>
  );
}

// ─── MinhaConta ───────────────────────────────────────────────────

export default function MinhaConta() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [section, setSection]               = useState('overview');
  const [orders, setOrders]                 = useState([]);
  const [profile, setProfile]               = useState(null);
  const [selectedOrder, setSelectedOrder]   = useState(null);
  const [loadingOrders, setLoadingOrders]   = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [ordersError, setOrdersError]       = useState('');
  const [cancellingId, setCancellingId]     = useState(null);
  const [toast, setToast]                   = useState(null);
  const [returnModal, setReturnModal]       = useState(null); // { orderId }
  const [returnReason, setReturnReason]     = useState('DEFECTIVE');
  const [returnNotes, setReturnNotes]       = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { state: { from: '/minha-conta' } });
  }, [isAuthenticated, navigate]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError('');
    try { setOrders(await getMyOrders()); }
    catch (err) { setOrdersError(err.message); }
    finally { setLoadingOrders(false); }
  }, []);

  const fetchProfile = useCallback(async (force = false) => {
    if (profile && !force) return;
    setLoadingProfile(true);
    try { setProfile(await getUserProfile()); }
    catch { /* fallback to session */ }
    finally { setLoadingProfile(false); }
  }, [profile]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (section === 'overview' || section === 'orders') fetchOrders();
    if (['overview', 'profile', 'address', 'security'].includes(section)) fetchProfile();
  }, [section, isAuthenticated]);

  async function handleCancelOrder(orderId) {
    if (!window.confirm('Deseja cancelar este pedido?')) return;
    setCancellingId(orderId);
    try {
      const updated = await cancelMyOrder(orderId);
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (err) { alert(err.message); }
    finally { setCancellingId(null); }
  }

  function goToSection(id) { setSection(id); setSelectedOrder(null); }

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Usuário';
  const firstName   = displayName.split(' ')[0];

  const NAV_ITEMS = [
    { id: 'overview',      Icon: FaShoppingBag,   label: 'Resumo' },
    { id: 'orders',        Icon: FaBoxOpen,        label: 'Meus Pedidos' },
    { id: 'profile',       Icon: FaUser,           label: 'Dados Pessoais' },
    { id: 'address',       Icon: FaMapMarkerAlt,   label: 'Endereços' },
    { id: 'security',      Icon: FaLock,           label: 'Segurança' },
    { id: 'payment',       Icon: FaCreditCard,  label: 'Pagamentos',    soon: true },
    { id: 'favorites',     Icon: FaHeart,       label: 'Favoritos' },
    { id: 'support',       Icon: FaHeadset,     label: 'Suporte' },
    { id: 'notifications', Icon: FaBell,        label: 'Notificações',  soon: true },
    { id: 'settings',      Icon: FaCog,         label: 'Configurações', soon: true },
  ];

  const SOON_SECTIONS = ['payment', 'notifications', 'settings'];
  if (!isAuthenticated) return null;

  // ── Section renderers ─────────────────────────────────────────

  function renderOverview() {
    const inProgress = orders.filter(o => ['PENDING_PAYMENT','PAID','PREPARING'].includes(o.status)).length;
    const shipped    = orders.filter(o => o.status === 'SHIPPED').length;
    const delivered  = orders.filter(o => o.status === 'DELIVERED').length;

    return (
      <div className="mc-section">
        <h1 className="mc-title">Olá, {firstName}!</h1>
        <p className="mc-subtitle">Bem-vindo ao seu painel de controle.</p>

        <div className="mc-stats-grid">
          {[
            { Icon: FaBoxOpen,     cls: '',             val: orders.length, label: 'Total de Pedidos' },
            { Icon: FaClock,       cls: 'icon-warning', val: inProgress,    label: 'Em Andamento' },
            { Icon: FaTruck,       cls: 'icon-blue',    val: shipped,       label: 'Enviados' },
            { Icon: FaCheckCircle, cls: 'icon-success', val: delivered,     label: 'Entregues' },
          ].map(({ Icon, cls, val, label }) => (
            <div key={label} className="mc-stat-card">
              <Icon className={`mc-stat-icon ${cls}`} />
              <div><span className="mc-stat-value">{val}</span><span className="mc-stat-label">{label}</span></div>
            </div>
          ))}
        </div>

        {loadingOrders ? (
          <div className="mc-loading">Carregando pedidos…</div>
        ) : orders.length > 0 ? (
          <div className="mc-recent-block">
            <div className="mc-block-header">
              <h2>Pedidos Recentes</h2>
              <button className="mc-text-btn" onClick={() => goToSection('orders')}>Ver todos →</button>
            </div>
            <div className="mc-orders-list">
              {orders.slice(0, 3).map(o => (
                <OrderCard key={o.id} order={o} onView={() => { setSelectedOrder(o); setSection('orders'); }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mc-empty">
            <FaShoppingBag className="mc-empty-icon" />
            <h3>Nenhum pedido ainda</h3>
            <p>Explore nosso catálogo e faça seu primeiro pedido!</p>
            <button className="mc-primary-btn" onClick={() => navigate('/catalogo')}>Ver Catálogo</button>
          </div>
        )}
      </div>
    );
  }

  function renderOrders() {
    if (selectedOrder) return renderOrderDetail();
    return (
      <div className="mc-section">
        <h1 className="mc-title">Meus Pedidos</h1>
        {loadingOrders && <div className="mc-loading">Carregando pedidos…</div>}
        {ordersError   && <div className="mc-error">{ordersError}</div>}
        {!loadingOrders && !ordersError && orders.length === 0 && (
          <div className="mc-empty">
            <FaBoxOpen className="mc-empty-icon" />
            <h3>Nenhum pedido encontrado</h3>
            <p>Você ainda não realizou nenhuma compra.</p>
            <button className="mc-primary-btn" onClick={() => navigate('/catalogo')}>Ir ao Catálogo</button>
          </div>
        )}
        {!loadingOrders && orders.length > 0 && (
          <div className="mc-orders-list">
            {orders.map(o => <OrderCard key={o.id} order={o} onView={() => setSelectedOrder(o)} />)}
          </div>
        )}
      </div>
    );
  }

  function renderOrderDetail() {
    const order      = selectedOrder;
    const cfg        = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'status-info', Icon: FaBoxOpen };
    const isCancelled  = order.status === 'CANCELLED';
    const canCancel    = order.status === 'PENDING_PAYMENT';
    const stepIndex    = TIMELINE_STEPS.indexOf(order.status);
    const isDelivered  = order.status === 'DELIVERED';
    const within30Days = isDelivered && order.updatedAt
      && (Date.now() - new Date(order.updatedAt).getTime()) < 30 * 24 * 60 * 60 * 1000;
    const canReturn    = within30Days;

    return (
      <div className="mc-section">
        <button className="mc-back-btn" onClick={() => setSelectedOrder(null)}>
          <FaArrowLeft /> Voltar aos pedidos
        </button>
        <div className="mc-detail-header">
          <div>
            <h1 className="mc-title">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
            <p className="mc-subtitle">Realizado em {formatDate(order.createdAt)}</p>
          </div>
          <span className={`mc-badge ${cfg.color}`}>{cfg.label}</span>
        </div>

        {!isCancelled && (
          <div className="mc-timeline">
            {TIMELINE_STEPS.map((step, idx) => {
              const s = STATUS_CONFIG[step];
              const completed = stepIndex >= idx;
              const current   = stepIndex === idx;
              return (
                <React.Fragment key={step}>
                  <div className={`mc-tl-step ${completed ? 'completed' : ''} ${current ? 'current' : ''}`}>
                    <div className="mc-tl-dot">{completed && <s.Icon />}</div>
                    <span className="mc-tl-label">{s.label}</span>
                  </div>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={`mc-tl-line ${stepIndex > idx ? 'completed' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div className="mc-detail-grid">
          <div className="mc-detail-card">
            <h3>Produtos</h3>
            <div className="mc-items-list">
              {order.items?.map(item => (
                <div key={item.id} className="mc-item-row">
                  {item.productImage && <img src={item.productImage} alt={item.productName} className="mc-item-img" />}
                  <div className="mc-item-info">
                    <span className="mc-item-name">{item.productName}</span>
                    <span className="mc-item-qty">Qtd: {item.quantity}</span>
                  </div>
                  <span className="mc-item-price">{formatCurrency((item.unitPrice ?? 0) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mc-items-total">
              <span>Total do pedido</span>
              <strong>{formatCurrency(order.totalAmount)}</strong>
            </div>
          </div>

          <div className="mc-detail-side">
            <div className="mc-detail-card">
              <h3>Informações</h3>
              <div className="mc-info-row"><span>Pagamento</span><strong>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</strong></div>
              <div className="mc-info-row"><span>Status</span><strong>{cfg.label}</strong></div>
              {order.trackingCode && (
                <TrackingSection
                  orderId={order.id}
                  trackingCode={order.trackingCode}
                  trackingUrl={order.trackingUrl}
                />
              )}
            </div>
            {order.deliveryAddress && (
              <div className="mc-detail-card">
                <h3>Endereço de Entrega</h3>
                <p className="mc-address-text">{order.deliveryAddress}</p>
              </div>
            )}
            {canCancel && (
              <button className="mc-cancel-btn" onClick={() => handleCancelOrder(order.id)} disabled={cancellingId === order.id}>
                {cancellingId === order.id ? 'Cancelando…' : 'Cancelar Pedido'}
              </button>
            )}
            {canReturn && (
              <button
                className="mc-cancel-btn"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderColor: 'var(--primary-soft-border)', marginTop: '0.5rem' }}
                onClick={() => { setReturnModal({ orderId: order.id }); setReturnReason('DEFECTIVE'); setReturnNotes(''); }}
              >
                Solicitar Devolução
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderProfile() {
    return (
      <ProfileSection
        profile={profile}
        loading={loadingProfile}
        onSaved={updated => { setProfile(updated); showToast('Dados atualizados com sucesso!'); }}
        onError={msg => showToast(msg, 'error')}
      />
    );
  }

  function renderAddress() {
    return (
      <AddressSection
        profile={profile}
        loading={loadingProfile}
        onSaved={updated => { setProfile(updated); showToast('Endereço atualizado com sucesso!'); }}
        onError={msg => showToast(msg, 'error')}
      />
    );
  }

  function renderSecurity() {
    return (
      <SecuritySection
        isGoogleAccount={profile?.googleAccount ?? false}
        onSaved={() => showToast('Senha alterada com sucesso!')}
        onError={msg => showToast(msg, 'error')}
      />
    );
  }

  function renderFavorites() {
    return <FavoritesSection onAddToCart={() => {}} />;
  }

  function renderSupport() {
    return <SupportSection />;
  }

  function renderComingSoon() {
    const labels = { payment: 'Métodos de Pagamento', notifications: 'Notificações', settings: 'Configurações' };
    return (
      <div className="mc-section">
        <h1 className="mc-title">{labels[section]}</h1>
        <div className="mc-coming-soon">
          <div className="mc-coming-soon-icon"><FaWrench /></div>
          <h3>Em breve</h3>
          <p>Esta funcionalidade está em desenvolvimento e será lançada em breve.</p>
        </div>
      </div>
    );
  }

  const SECTION_LABELS = {
    overview: 'Resumo', orders: 'Meus Pedidos', profile: 'Dados Pessoais',
    address: 'Endereços', security: 'Segurança', payment: 'Pagamentos',
    favorites: 'Favoritos', support: 'Suporte', notifications: 'Notificações',
    settings: 'Configurações',
  };

  return (
    <div className="mc-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mc-container container">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Minha Conta', href: '/minha-conta' },
          { label: SECTION_LABELS[section] ?? section },
        ]} />

        {/* Sidebar */}
        <aside className="mc-sidebar">
          <div className="mc-sidebar-user">
            <div className="mc-avatar">{displayName.charAt(0).toUpperCase()}</div>
            <div className="mc-sidebar-info">
              <span className="mc-sidebar-name">{displayName}</span>
              <span className="mc-sidebar-email">{user?.email}</span>
            </div>
          </div>
          <nav className="mc-nav">
            {NAV_ITEMS.map(({ id, Icon, label, soon }) => (
              <button
                key={id}
                className={`mc-nav-item ${section === id ? 'active' : ''} ${soon ? 'disabled' : ''}`}
                onClick={() => !soon && goToSection(id)}
                title={soon ? 'Em breve' : undefined}
              >
                <Icon className="mc-nav-icon" />
                <span>{label}</span>
                {soon
                  ? <span className="mc-soon-tag">Em breve</span>
                  : <FaChevronRight className="mc-nav-arrow" />}
              </button>
            ))}
            <button className="mc-nav-item mc-nav-logout" onClick={logout}>
              <FaSignOutAlt className="mc-nav-icon" /><span>Sair da conta</span>
            </button>
          </nav>
        </aside>

        {/* Main */}
        <main className="mc-main">
          {section === 'overview'               && renderOverview()}
          {section === 'orders'                 && renderOrders()}
          {section === 'profile'                && renderProfile()}
          {section === 'address'                && renderAddress()}
          {section === 'security'               && renderSecurity()}
          {section === 'favorites'              && renderFavorites()}
          {section === 'support'                && renderSupport()}
          {SOON_SECTIONS.includes(section)      && renderComingSoon()}
        </main>
      </div>

      {/* ── Return request modal ── */}
      {returnModal && (
        <div className="mc-modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="mc-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-header">
              <h2>Solicitar Devolução</h2>
              <button onClick={() => setReturnModal(null)}><FaTimes /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmittingReturn(true);
              try {
                await createReturn(returnModal.orderId, returnReason, returnNotes || null);
                setReturnModal(null);
                showToast('Solicitação de devolução enviada com sucesso!');
              } catch (err) {
                showToast(err.message, 'error');
              } finally {
                setSubmittingReturn(false);
              }
            }}>
              <div className="mc-modal-field">
                <label>Motivo da devolução *</label>
                <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                  <option value="DEFECTIVE">Produto com defeito</option>
                  <option value="WRONG_ITEM">Produto errado</option>
                  <option value="CHANGED_MIND">Mudei de ideia</option>
                  <option value="DAMAGED_SHIPPING">Danificado no transporte</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              <div className="mc-modal-field">
                <label>Detalhes adicionais</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o problema (opcional)"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                Prazo de devolução: até 30 dias após a entrega. Nossa equipe analisará a solicitação em até 3 dias úteis.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="mc-btn-outline" onClick={() => setReturnModal(null)}>Cancelar</button>
                <button type="submit" className="mc-action-btn" disabled={submittingReturn}>
                  {submittingReturn ? 'Enviando…' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TrackingSection ──────────────────────────────────────────────

function TrackingSection({ orderId, trackingCode, trackingUrl }) {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched]   = useState(false);

  async function handleToggle() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (fetched) return;
    setLoading(true);
    try {
      const data = await getOrderTracking(orderId);
      setEvents(Array.isArray(data) ? data : []);
    } catch { /* fallback silencioso */ }
    finally { setLoading(false); setFetched(true); }
  }

  const STATUS_ICON = {
    posted:           '📬',
    released:         '📦',
    in_transit:       '🚚',
    out_for_delivery: '🏠',
    delivered:        '✅',
    failed:           '⚠️',
  };

  return (
    <div className="mc-tracking-section">
      <div className="mc-info-row">
        <span>Rastreio</span>
        <div className="mc-tracking-row">
          {trackingUrl
            ? <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="mc-tracking mc-tracking-link">{trackingCode}</a>
            : <strong className="mc-tracking">{trackingCode}</strong>}
          <button className="mc-tracking-toggle" onClick={handleToggle}>
            {expanded ? 'Fechar ▲' : 'Ver eventos ▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mc-tracking-events">
          {loading ? (
            <>
              <div className="mc-tev-skeleton" />
              <div className="mc-tev-skeleton mc-tev-skeleton--short" />
              <div className="mc-tev-skeleton" />
            </>
          ) : events.length === 0 ? (
            <p className="mc-tev-empty">Nenhum evento disponível ainda. Tente novamente em breve.</p>
          ) : (
            <div className="mc-tev-list">
              {events.map((ev, idx) => (
                <div key={idx} className={`mc-tev-item ${idx === 0 ? 'mc-tev-item--latest' : ''}`}>
                  <div className="mc-tev-marker">
                    <span className="mc-tev-icon">{STATUS_ICON[ev.status] ?? '📍'}</span>
                    {idx < events.length - 1 && <div className="mc-tev-connector" />}
                  </div>
                  <div className="mc-tev-body">
                    <p className="mc-tev-desc">{ev.description ?? ev.status}</p>
                    {ev.location && <span className="mc-tev-location">{ev.location}</span>}
                    {ev.occurredAt && <span className="mc-tev-date">{ev.occurredAt}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ProfileSection ───────────────────────────────────────────────

function ProfileSection({ profile: p, loading, onSaved, onError }) {
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(null);

  function startEdit() {
    setForm({
      fullName:  p?.fullName  ?? '',
      cpf:       '',
      phone:     p?.phone     ?? '',
      birthDate: p?.birthDate ?? '',
    });
    setEditing(true);
  }

  function cancelEdit() { setEditing(false); setForm(null); }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.fullName.trim()) { onError('Nome completo é obrigatório.'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName:  form.fullName.trim(),
        cpf:       !p?.cpf && form.cpf ? form.cpf : null,
        phone:     form.phone || null,
        birthDate: form.birthDate || null,
        address:   p?.address   ?? null,
        city:      p?.city      ?? null,
        state:     p?.state     ?? null,
        zipCode:   p?.zipCode   ?? null,
      });
      onSaved(updated);
      setEditing(false);
      setForm(null);
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mc-section"><div className="mc-loading">Carregando perfil…</div></div>;

  return (
    <div className="mc-section">
      <div className="mc-section-head">
        <div>
          <h1 className="mc-title">Dados Pessoais</h1>
          <p className="mc-subtitle">Suas informações cadastradas na plataforma.</p>
        </div>
        {!editing && (
          <button className="mc-edit-btn" onClick={startEdit}><FaEdit /> Editar</button>
        )}
      </div>

      <div className="mc-profile-wrap">
        <div className="mc-profile-avatar-col">
          <div className="mc-avatar-lg">{(p?.fullName ?? 'U').charAt(0).toUpperCase()}</div>
          <span className="mc-profile-role">{p?.role === 'CUSTOMER' ? 'Cliente' : p?.role ?? ''}</span>
        </div>

        {!editing ? (
          <div className="mc-profile-fields">
            <ProfileField label="Nome Completo"      value={p?.fullName} />
            <ProfileField label="E-mail"             value={p?.email} />
            <ProfileField label="CPF"                value={p?.cpf} note="Não editável" />
            <ProfileField label="Data de Nascimento" value={p?.birthDate ? formatShortDate(p.birthDate) : null} />
            <ProfileField label="Telefone"           value={p?.phone ? formatPhone(p.phone) : null} />
            <ProfileField label="Membro desde"       value={p?.createdAt ? formatShortDate(p.createdAt) : null} />
          </div>
        ) : (
          <form className="mc-edit-form" onSubmit={handleSave}>
            <div className="mc-form-grid">
              <div className="mc-field-group mc-field-full">
                <label>Nome Completo *</label>
                <input name="fullName" value={form.fullName} onChange={onChange} required placeholder="Seu nome completo" />
              </div>
              <div className="mc-field-group">
                <label>E-mail</label>
                <input value={p?.email ?? ''} disabled className="mc-input-disabled" />
                <span className="mc-field-note">O e-mail não pode ser alterado</span>
              </div>
              {p?.cpf ? (
                <div className="mc-field-group">
                  <label>CPF</label>
                  <input value={p.cpf} disabled className="mc-input-disabled" />
                  <span className="mc-field-note">O CPF não pode ser alterado</span>
                </div>
              ) : (
                <div className="mc-field-group">
                  <label>CPF</label>
                  <input
                    name="cpf"
                    value={form?.cpf ?? ''}
                    onChange={onChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  <span className="mc-field-note">Informe seu CPF para habilitar compras</span>
                </div>
              )}
              <div className="mc-field-group">
                <label>Data de Nascimento</label>
                <input name="birthDate" type="date" value={form.birthDate} onChange={onChange} />
              </div>
              <div className="mc-field-group">
                <label>Telefone</label>
                <input name="phone" value={form.phone} onChange={onChange} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="mc-form-actions">
              <button type="button" className="mc-cancel-form-btn" onClick={cancelEdit} disabled={saving}>
                <FaTimes /> Cancelar
              </button>
              <button type="submit" className="mc-save-btn" disabled={saving}>
                <FaSave /> {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── AddressSection ───────────────────────────────────────────────

function AddressSection({ profile: p, loading, onSaved, onError }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState(null);
  const hasAddress = p?.address || p?.city;

  function startEdit() {
    setForm({
      address: p?.address ?? '',
      city:    p?.city    ?? '',
      state:   p?.state   ?? '',
      zipCode: p?.zipCode ?? '',
    });
    setEditing(true);
  }

  function cancelEdit() { setEditing(false); setForm(null); }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.address.trim()) { onError('Endereço é obrigatório.'); return; }
    if (!form.city.trim())    { onError('Cidade é obrigatória.'); return; }
    if (!form.state)          { onError('Estado é obrigatório.'); return; }
    if (!form.zipCode.trim()) { onError('CEP é obrigatório.'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName:  p?.fullName  ?? '',
        phone:     p?.phone     ?? null,
        birthDate: p?.birthDate ?? null,
        address:   form.address.trim(),
        city:      form.city.trim(),
        state:     form.state,
        zipCode:   form.zipCode.replace(/\D/g, ''),
      });
      onSaved(updated);
      setEditing(false);
      setForm(null);
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mc-section"><div className="mc-loading">Carregando…</div></div>;

  return (
    <div className="mc-section">
      <div className="mc-section-head">
        <div>
          <h1 className="mc-title">Endereços</h1>
          <p className="mc-subtitle">Seu endereço de entrega principal.</p>
        </div>
        {!editing && (
          <button className="mc-edit-btn" onClick={startEdit}>
            <FaEdit /> {hasAddress ? 'Editar' : 'Adicionar'}
          </button>
        )}
      </div>

      {!editing ? (
        hasAddress ? (
          <div className="mc-address-card">
            <div className="mc-address-card-head"><FaMapMarkerAlt /><span>Endereço Principal</span></div>
            {p.address  && <p>{p.address}</p>}
            {(p.city || p.state) && <p>{[p.city, p.state].filter(Boolean).join(', ')}</p>}
            {p.zipCode  && <p>CEP: {formatZip(p.zipCode)}</p>}
          </div>
        ) : (
          <div className="mc-empty">
            <FaMapMarkerAlt className="mc-empty-icon" />
            <h3>Nenhum endereço cadastrado</h3>
            <p>Clique em "Adicionar" para cadastrar seu endereço de entrega.</p>
          </div>
        )
      ) : (
        <form className="mc-edit-form" onSubmit={handleSave}>
          <div className="mc-form-grid">
            <div className="mc-field-group mc-field-full">
              <label>Endereço (Rua, número, complemento) *</label>
              <input name="address" value={form.address} onChange={onChange} required placeholder="Ex: Rua das Flores, 123, Apto 45" />
            </div>
            <div className="mc-field-group">
              <label>Cidade *</label>
              <input name="city" value={form.city} onChange={onChange} required placeholder="Ex: São Paulo" />
            </div>
            <div className="mc-field-group">
              <label>Estado (UF) *</label>
              <select name="state" value={form.state} onChange={onChange} required>
                <option value="">Selecione</option>
                {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="mc-field-group">
              <label>CEP *</label>
              <input name="zipCode" value={form.zipCode} onChange={onChange} required placeholder="00000-000" maxLength={9} />
            </div>
          </div>
          <div className="mc-form-actions">
            <button type="button" className="mc-cancel-form-btn" onClick={cancelEdit} disabled={saving}>
              <FaTimes /> Cancelar
            </button>
            <button type="submit" className="mc-save-btn" disabled={saving}>
              <FaSave /> {saving ? 'Salvando…' : 'Salvar endereço'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── SecuritySection ──────────────────────────────────────────────

function SecuritySection({ isGoogleAccount, onSaved, onError }) {
  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!isGoogleAccount && !form.currentPassword) errs.currentPassword = 'Informe a senha atual.';
    if (!form.newPassword)     errs.newPassword = 'Informe a nova senha.';
    else if (form.newPassword.length < 8) errs.newPassword = 'A nova senha deve ter pelo menos 8 caracteres.';
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'As senhas não coincidem.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await changePassword({
        currentPassword: isGoogleAccount ? null : form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSaved();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function PasswordInput({ name, label, placeholder }) {
    const key = name === 'currentPassword' ? 'current' : name === 'newPassword' ? 'new' : 'confirm';
    return (
      <div className="mc-field-group">
        <label>{label}</label>
        <div className="mc-pwd-wrap">
          <input
            name={name}
            type={showPwd[key] ? 'text' : 'password'}
            value={form[name]}
            onChange={onChange}
            placeholder={placeholder}
            className={errors[name] ? 'mc-input-error' : ''}
          />
          <button type="button" className="mc-pwd-toggle" onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}>
            {showPwd[key] ? '🙈' : '👁️'}
          </button>
        </div>
        {errors[name] && <span className="mc-field-error">{errors[name]}</span>}
      </div>
    );
  }

  return (
    <div className="mc-section">
      <h1 className="mc-title">Segurança</h1>
      <p className="mc-subtitle">Altere sua senha de acesso à conta.</p>

      <div className="mc-security-card">
        <div className="mc-security-icon"><FaLock /></div>
        <form className="mc-edit-form" onSubmit={handleSubmit} style={{ flex: 1 }}>
          {isGoogleAccount && (
            <div className="mc-google-pwd-notice">
              Sua conta foi criada com o Google. Defina uma senha para também poder entrar com e-mail e senha.
            </div>
          )}
          <div className="mc-form-grid">
            {!isGoogleAccount && (
              <PasswordInput name="currentPassword" label="Senha atual *" placeholder="Digite sua senha atual" />
            )}
            <PasswordInput name="newPassword"     label="Nova senha *"     placeholder="Mínimo 8 caracteres" />
            <PasswordInput name="confirmPassword" label="Confirmar nova senha *" placeholder="Repita a nova senha" />
          </div>

          <div className="mc-pwd-rules">
            <span className={form.newPassword.length >= 8 ? 'rule-ok' : ''}>✓ Mínimo 8 caracteres</span>
            <span className={/[A-Z]/.test(form.newPassword) ? 'rule-ok' : ''}>✓ Uma letra maiúscula</span>
            <span className={/\d/.test(form.newPassword) ? 'rule-ok' : ''}>✓ Um número</span>
          </div>

          <div className="mc-form-actions">
            <button type="submit" className="mc-save-btn" disabled={saving}>
              <FaLock /> {saving ? 'Alterando…' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="mc-danger-zone">
        <h2 className="mc-danger-title">Zona de perigo</h2>
        <div className="mc-danger-card">
          <div className="mc-danger-info">
            <strong>Excluir conta</strong>
            <p>Remove permanentemente sua conta e todos os seus dados. Esta ação não pode ser desfeita.</p>
          </div>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}

function DeleteAccountButton() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.')) return;
    if (!window.confirm('Confirmação final: todos os seus dados serão excluídos permanentemente.')) return;
    setBusy(true);
    try {
      await deleteAccount();
      logout();
      navigate('/');
    } catch (err) {
      alert(err.message || 'Não foi possível excluir a conta. Tente novamente.');
      setBusy(false);
    }
  };

  return (
    <button className="mc-delete-btn" onClick={handleDelete} disabled={busy}>
      {busy ? 'Excluindo…' : 'Excluir conta'}
    </button>
  );
}

// ─── ProfileField ─────────────────────────────────────────────────

function ProfileField({ label, value, note }) {
  return (
    <div className="mc-profile-field">
      <label>{label}</label>
      <span className={!value ? 'mc-field-empty' : ''}>{value || '—'}</span>
      {note && <small className="mc-field-note">{note}</small>}
    </div>
  );
}

// ─── FavoritesSection ─────────────────────────────────────────────

function FavoritesSection({ onAddToCart }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites()
      .then(setFavorites)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveFav = async (productId) => {
    try {
      await toggleFavorite(productId);
      setFavorites((prev) => prev.filter((p) => p.id !== productId));
    } catch {}
  };

  if (loading) return (
    <div className="mc-section">
      <div className="mc-loading">Carregando favoritos…</div>
    </div>
  );

  return (
    <div className="mc-section">
      <div className="mc-section-head">
        <div>
          <h1 className="mc-title">Meus Favoritos</h1>
          <p className="mc-subtitle">
            {favorites.length === 0
              ? 'Nenhum produto salvo'
              : `${favorites.length} ${favorites.length === 1 ? 'produto salvo' : 'produtos salvos'}`}
          </p>
        </div>
        <Link to="/catalogo" className="mc-action-btn">Explorar catálogo</Link>
      </div>

      {favorites.length === 0 ? (
        <div className="mc-empty-state">
          <FaHeart className="mc-empty-icon" />
          <p>Você ainda não favoritou nenhum produto.</p>
          <p>Clique no coração <FaHeart style={{ color: 'var(--danger)' }} /> nos produtos para salvá-los aqui.</p>
        </div>
      ) : (
        <div className="mc-fav-grid">
          {favorites.map((product) => {
            const isPromo = Boolean(product.isPromo);
            const price   = isPromo ? product.promotionalPrice : product.price;
            const img     = product.images?.[0] || product.image;
            return (
              <div key={product.id} className="mc-fav-card">
                <button
                  className="mc-fav-remove"
                  onClick={() => handleRemoveFav(product.id)}
                  title="Remover dos favoritos"
                >
                  <FaHeart />
                </button>
                <div
                  className="mc-fav-img"
                  onClick={() => navigate(`/produto/${product.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {img
                    ? <img src={img} alt={product.name} />
                    : <div className="mc-fav-img-placeholder" />}
                </div>
                <div className="mc-fav-info">
                  <p className="mc-fav-name"
                     onClick={() => navigate(`/produto/${product.id}`)}
                     style={{ cursor: 'pointer' }}>
                    {product.name}
                  </p>
                  <p className={`mc-fav-price${isPromo ? ' mc-fav-price--promo' : ''}`}>
                    {Number(price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <button className="btn-gold mc-fav-add-btn" onClick={() => onAddToCart(product)}>
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SupportSection ───────────────────────────────────────────────

const STATUS_COLORS = {
  OPEN:              'status-info',
  IN_PROGRESS:       'status-blue',
  AWAITING_RESPONSE: 'status-warning',
  CLOSED:            'status-success',
};

function SupportSection() {
  const [view, setView]           = useState('list'); // 'list' | 'new' | 'detail'
  const [tickets, setTickets]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [replyText, setReplyText] = useState('');
  const [form, setForm]           = useState({ subject: '', category: '', message: '' });
  const [formErr, setFormErr]     = useState('');

  useEffect(() => {
    fetchMyTickets()
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function openTicket(ticket) {
    const full = await fetchMyTicket(ticket.id).catch(() => ticket);
    setSelected(full);
    setView('detail');
    setReplyText('');
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.category || !form.message.trim()) {
      setFormErr('Preencha todos os campos.');
      return;
    }
    setSending(true);
    setFormErr('');
    try {
      const created = await createTicket(form);
      setTickets((prev) => [created, ...prev]);
      setSelected(created);
      setView('detail');
      setForm({ subject: '', category: '', message: '' });
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const updated = await replyTicket(selected.id, replyText);
      setSelected(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setReplyText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  if (loading) return (
    <div className="mc-section">
      <div className="mc-loading">Carregando tickets…</div>
    </div>
  );

  // ── Detail view ──────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    return (
      <div className="mc-section">
        <button className="mc-back-link" onClick={() => setView('list')}>
          <FaArrowLeft /> Voltar para suporte
        </button>
        <div className="mc-ticket-detail-header">
          <div>
            <h1 className="mc-title">{selected.subject}</h1>
            <div className="mc-ticket-meta">
              <span className="mc-ticket-number">{selected.ticketNumber}</span>
              <span className={`mc-status-badge ${STATUS_COLORS[selected.status]}`}>
                {TICKET_STATUS_LABELS[selected.status]}
              </span>
              <span className="mc-ticket-cat">{selected.category}</span>
            </div>
          </div>
        </div>

        <div className="mc-conversation">
          {selected.messages?.map((msg) => (
            <div
              key={msg.id}
              className={`mc-msg${msg.authorRole === 'SUPPORT' ? ' mc-msg--support' : ' mc-msg--customer'}`}
            >
              <div className="mc-msg-avatar">
                {msg.authorRole === 'SUPPORT' ? <FaHeadset /> : msg.authorName?.charAt(0).toUpperCase()}
              </div>
              <div className="mc-msg-body">
                <div className="mc-msg-author">
                  <strong>{msg.authorRole === 'SUPPORT' ? 'Equipe de Suporte' : msg.authorName}</strong>
                  <span className="mc-msg-time">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="mc-msg-content">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {selected.status !== 'CLOSED' && (
          <form className="mc-reply-form" onSubmit={handleReply}>
            <textarea
              className="mc-reply-textarea"
              rows={3}
              placeholder="Escreva sua resposta…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="mc-save-btn" disabled={sending || !replyText.trim()}>
              <FaPaperPlane /> {sending ? 'Enviando…' : 'Enviar resposta'}
            </button>
          </form>
        )}
        {selected.status === 'CLOSED' && (
          <p className="mc-ticket-closed-note">Este ticket foi encerrado. Abra um novo para continuar.</p>
        )}
      </div>
    );
  }

  // ── New ticket form ──────────────────────────────────────────────
  if (view === 'new') {
    return (
      <div className="mc-section">
        <button className="mc-back-link" onClick={() => setView('list')}>
          <FaArrowLeft /> Voltar
        </button>
        <h1 className="mc-title">Abrir Ticket de Suporte</h1>
        <p className="mc-subtitle">Descreva seu problema e nossa equipe entrará em contato.</p>
        <form className="mc-ticket-form" onSubmit={handleCreate}>
          <div className="mc-form-group">
            <label className="mc-label">Categoria *</label>
            <select
              className="mc-select"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              disabled={sending}
            >
              <option value="">Selecione uma categoria</option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="mc-form-group">
            <label className="mc-label">Assunto *</label>
            <input
              className="mc-input"
              type="text"
              placeholder="Ex: Pedido não chegou no prazo"
              maxLength={120}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              disabled={sending}
            />
            <small className="mc-char-count">{form.subject.length}/120</small>
          </div>
          <div className="mc-form-group">
            <label className="mc-label">Descrição *</label>
            <textarea
              className="mc-textarea"
              rows={5}
              placeholder="Descreva seu problema com o máximo de detalhes possível…"
              maxLength={4000}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              disabled={sending}
            />
            <small className="mc-char-count">{form.message.length}/4000</small>
          </div>
          {formErr && <p className="mc-form-error">{formErr}</p>}
          <div className="mc-form-actions">
            <button type="button" className="mc-cancel-btn" onClick={() => setView('list')}>
              Cancelar
            </button>
            <button type="submit" className="mc-save-btn" disabled={sending}>
              <FaPaperPlane /> {sending ? 'Abrindo…' : 'Abrir ticket'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Ticket list ──────────────────────────────────────────────────
  return (
    <div className="mc-section">
      <div className="mc-section-head">
        <div>
          <h1 className="mc-title">Suporte</h1>
          <p className="mc-subtitle">Acompanhe seus chamados de atendimento</p>
        </div>
        <button className="mc-action-btn" onClick={() => setView('new')}>
          <FaPlus /> Novo ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="mc-empty-state">
          <FaHeadset className="mc-empty-icon" />
          <p>Você não possui tickets abertos.</p>
          <button className="mc-action-btn" onClick={() => setView('new')}>
            <FaPlus /> Abrir meu primeiro ticket
          </button>
        </div>
      ) : (
        <div className="mc-ticket-list">
          {tickets.map((t) => (
            <button key={t.id} className="mc-ticket-item" onClick={() => openTicket(t)}>
              <div className="mc-ticket-item-main">
                <span className="mc-ticket-number">{t.ticketNumber}</span>
                <p className="mc-ticket-subject">{t.subject}</p>
                <span className="mc-ticket-cat-pill">{t.category}</span>
              </div>
              <div className="mc-ticket-item-side">
                <span className={`mc-status-badge ${STATUS_COLORS[t.status]}`}>
                  {TICKET_STATUS_LABELS[t.status]}
                </span>
                <span className="mc-ticket-date">{formatDate(t.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  function formatDate(d) {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}

