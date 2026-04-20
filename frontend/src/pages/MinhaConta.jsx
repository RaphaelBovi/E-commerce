import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaBoxOpen, FaMapMarkerAlt, FaHeart, FaTicketAlt,
  FaBell, FaCog, FaSignOutAlt, FaChevronRight, FaArrowLeft,
  FaShoppingBag, FaCheckCircle, FaTruck, FaTimesCircle, FaClock,
  FaCreditCard,
} from 'react-icons/fa';
import { useAuth } from '../context/useAuth';
import { getMyOrders, cancelMyOrder } from '../services/ordersApi';
import { getUserProfile } from '../services/authApi';
import './MinhaConta.css';

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

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatShortDate(dateString) {
  if (!dateString) return '-';
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  }
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

// ─── OrderCard ────────────────────────────────────────────────────
function OrderCard({ order, onView }) {
  const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: 'status-info' };
  const itemCount = order.items?.length ?? 0;

  return (
    <div className="mc-order-card">
      <div className="mc-order-card-header">
        <div className="mc-order-card-id">
          <FaBoxOpen />
          <span>Pedido #{order.id.slice(-8).toUpperCase()}</span>
        </div>
        <span className={`mc-badge ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="mc-order-card-meta">
        <span>{formatDate(order.createdAt)}</span>
        <span>·</span>
        <span>{itemCount} {itemCount === 1 ? 'produto' : 'produtos'}</span>
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

  const [section, setSection]           = useState('overview');
  const [orders, setOrders]             = useState([]);
  const [profile, setProfile]           = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [ordersError, setOrdersError]   = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { state: { from: '/minha-conta' } });
  }, [isAuthenticated, navigate]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError('');
    try {
      setOrders(await getMyOrders());
    } catch (err) {
      setOrdersError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (profile) return;
    setLoadingProfile(true);
    try {
      setProfile(await getUserProfile());
    } catch {
      // silently fall back to session data
    } finally {
      setLoadingProfile(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (section === 'overview' || section === 'orders') fetchOrders();
    if (section === 'overview' || section === 'profile' || section === 'address') fetchProfile();
  }, [section, isAuthenticated]);

  async function handleCancelOrder(orderId) {
    if (!window.confirm('Deseja cancelar este pedido?')) return;
    setCancellingId(orderId);
    try {
      const updated = await cancelMyOrder(orderId);
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  function goToSection(id) {
    setSection(id);
    setSelectedOrder(null);
  }

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Usuário';
  const firstName   = displayName.split(' ')[0];

  const NAV_ITEMS = [
    { id: 'overview',       Icon: FaShoppingBag,  label: 'Resumo' },
    { id: 'orders',         Icon: FaBoxOpen,       label: 'Meus Pedidos' },
    { id: 'profile',        Icon: FaUser,          label: 'Dados Pessoais' },
    { id: 'address',        Icon: FaMapMarkerAlt,  label: 'Endereços' },
    { id: 'payment',        Icon: FaCreditCard,    label: 'Pagamentos',    soon: true },
    { id: 'favorites',      Icon: FaHeart,         label: 'Favoritos',     soon: true },
    { id: 'coupons',        Icon: FaTicketAlt,     label: 'Cupons',        soon: true },
    { id: 'notifications',  Icon: FaBell,          label: 'Notificações',  soon: true },
    { id: 'settings',       Icon: FaCog,           label: 'Configurações', soon: true },
  ];

  if (!isAuthenticated) return null;

  // ── Render helpers ────────────────────────────────────────────────

  function renderOverview() {
    const inProgress = orders.filter(o =>
      ['PENDING_PAYMENT', 'PAID', 'PREPARING'].includes(o.status)
    ).length;
    const shipped   = orders.filter(o => o.status === 'SHIPPED').length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;

    return (
      <div className="mc-section">
        <h1 className="mc-title">Olá, {firstName}!</h1>
        <p className="mc-subtitle">Bem-vindo ao seu painel de controle.</p>

        <div className="mc-stats-grid">
          {[
            { Icon: FaBoxOpen,      cls: '',              val: orders.length, label: 'Total de Pedidos' },
            { Icon: FaClock,        cls: 'icon-warning',  val: inProgress,    label: 'Em Andamento' },
            { Icon: FaTruck,        cls: 'icon-blue',     val: shipped,       label: 'Enviados' },
            { Icon: FaCheckCircle,  cls: 'icon-success',  val: delivered,     label: 'Entregues' },
          ].map(({ Icon, cls, val, label }) => (
            <div key={label} className="mc-stat-card">
              <Icon className={`mc-stat-icon ${cls}`} />
              <div>
                <span className="mc-stat-value">{val}</span>
                <span className="mc-stat-label">{label}</span>
              </div>
            </div>
          ))}
        </div>

        {loadingOrders ? (
          <div className="mc-loading">Carregando pedidos…</div>
        ) : orders.length > 0 ? (
          <div className="mc-recent-block">
            <div className="mc-block-header">
              <h2>Pedidos Recentes</h2>
              <button className="mc-text-btn" onClick={() => goToSection('orders')}>
                Ver todos →
              </button>
            </div>
            <div className="mc-orders-list">
              {orders.slice(0, 3).map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={() => { setSelectedOrder(order); setSection('orders'); }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mc-empty">
            <FaShoppingBag className="mc-empty-icon" />
            <h3>Nenhum pedido ainda</h3>
            <p>Explore nosso catálogo e faça seu primeiro pedido!</p>
            <button className="mc-primary-btn" onClick={() => navigate('/catalogo')}>
              Ver Catálogo
            </button>
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
            <button className="mc-primary-btn" onClick={() => navigate('/catalogo')}>
              Ir ao Catálogo
            </button>
          </div>
        )}

        {!loadingOrders && orders.length > 0 && (
          <div className="mc-orders-list">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderOrderDetail() {
    const order      = selectedOrder;
    const cfg        = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'status-info', Icon: FaBoxOpen };
    const isCancelled = order.status === 'CANCELLED';
    const canCancel   = order.status === 'PENDING_PAYMENT';
    const stepIndex   = TIMELINE_STEPS.indexOf(order.status);

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
              const s          = STATUS_CONFIG[step];
              const completed  = stepIndex >= idx;
              const current    = stepIndex === idx;
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
                  {item.productImage && (
                    <img src={item.productImage} alt={item.productName} className="mc-item-img" />
                  )}
                  <div className="mc-item-info">
                    <span className="mc-item-name">{item.productName}</span>
                    <span className="mc-item-qty">Qtd: {item.quantity}</span>
                  </div>
                  <span className="mc-item-price">
                    {formatCurrency((item.unitPrice ?? 0) * item.quantity)}
                  </span>
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
                <div className="mc-info-row">
                  <span>Rastreio</span>
                  <strong className="mc-tracking">{order.trackingCode}</strong>
                </div>
              )}
            </div>

            {order.deliveryAddress && (
              <div className="mc-detail-card">
                <h3>Endereço de Entrega</h3>
                <p className="mc-address-text">{order.deliveryAddress}</p>
              </div>
            )}

            {canCancel && (
              <button
                className="mc-cancel-btn"
                onClick={() => handleCancelOrder(order.id)}
                disabled={cancellingId === order.id}
              >
                {cancellingId === order.id ? 'Cancelando…' : 'Cancelar Pedido'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderProfile() {
    if (loadingProfile) return <div className="mc-section"><div className="mc-loading">Carregando perfil…</div></div>;
    const p = profile;

    return (
      <div className="mc-section">
        <h1 className="mc-title">Dados Pessoais</h1>
        <div className="mc-profile-card">
          <div className="mc-avatar-lg">{displayName.charAt(0).toUpperCase()}</div>
          <div className="mc-profile-grid">
            {[
              { label: 'Nome Completo',       value: p?.fullName },
              { label: 'E-mail',              value: p?.email ?? user?.email },
              { label: 'CPF',                 value: p?.cpf },
              { label: 'Data de Nascimento',  value: p?.birthDate ? formatShortDate(p.birthDate) : null },
              { label: 'Telefone',            value: p?.phone },
              { label: 'Membro desde',        value: p?.createdAt ? formatShortDate(p.createdAt) : null },
            ].map(({ label, value }) => (
              <div key={label} className="mc-profile-field">
                <label>{label}</label>
                <span>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderAddress() {
    if (loadingProfile) return <div className="mc-section"><div className="mc-loading">Carregando…</div></div>;
    const p = profile;

    return (
      <div className="mc-section">
        <h1 className="mc-title">Endereços</h1>
        {p?.address || p?.city ? (
          <div className="mc-address-card">
            <div className="mc-address-card-head">
              <FaMapMarkerAlt /> <span>Endereço Principal</span>
            </div>
            {p.address  && <p>{p.address}</p>}
            {(p.city || p.state) && <p>{[p.city, p.state].filter(Boolean).join(', ')}</p>}
            {p.zipCode  && <p>CEP: {p.zipCode}</p>}
          </div>
        ) : (
          <div className="mc-empty">
            <FaMapMarkerAlt className="mc-empty-icon" />
            <h3>Nenhum endereço cadastrado</h3>
            <p>Seu endereço será salvo automaticamente ao realizar um pedido.</p>
          </div>
        )}
      </div>
    );
  }

  function renderComingSoon() {
    const labels = {
      payment:       'Métodos de Pagamento',
      favorites:     'Favoritos',
      coupons:       'Cupons',
      notifications: 'Notificações',
      settings:      'Configurações',
    };
    return (
      <div className="mc-section">
        <h1 className="mc-title">{labels[section]}</h1>
        <div className="mc-coming-soon">
          <span className="mc-coming-soon-emoji">🚧</span>
          <h3>Em breve</h3>
          <p>Esta funcionalidade está em desenvolvimento e será lançada em breve.</p>
        </div>
      </div>
    );
  }

  const SOON_SECTIONS = ['payment', 'favorites', 'coupons', 'notifications', 'settings'];

  return (
    <div className="mc-page">
      <div className="mc-container container">

        {/* ── Sidebar ───────────────────────────────────────────── */}
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
                  : <FaChevronRight className="mc-nav-arrow" />
                }
              </button>
            ))}

            <button className="mc-nav-item mc-nav-logout" onClick={logout}>
              <FaSignOutAlt className="mc-nav-icon" />
              <span>Sair da conta</span>
            </button>
          </nav>
        </aside>

        {/* ── Main ──────────────────────────────────────────────── */}
        <main className="mc-main">
          {section === 'overview'                   && renderOverview()}
          {section === 'orders'                     && renderOrders()}
          {section === 'profile'                    && renderProfile()}
          {section === 'address'                    && renderAddress()}
          {SOON_SECTIONS.includes(section)          && renderComingSoon()}
        </main>

      </div>
    </div>
  );
}
