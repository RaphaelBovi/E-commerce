import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaBoxOpen, FaMapMarkerAlt, FaHeart, FaTicketAlt,
  FaBell, FaCog, FaSignOutAlt, FaChevronRight, FaArrowLeft,
  FaShoppingBag, FaCheckCircle, FaTruck, FaTimesCircle, FaClock,
  FaCreditCard, FaLock, FaEdit, FaSave, FaTimes,
} from 'react-icons/fa';
import { useAuth } from '../context/useAuth';
import { getMyOrders, cancelMyOrder } from '../services/ordersApi';
import { getUserProfile, updateProfile, changePassword } from '../services/authApi';
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
    { id: 'payment',       Icon: FaCreditCard,     label: 'Pagamentos',    soon: true },
    { id: 'favorites',     Icon: FaHeart,          label: 'Favoritos',     soon: true },
    { id: 'coupons',       Icon: FaTicketAlt,      label: 'Cupons',        soon: true },
    { id: 'notifications', Icon: FaBell,           label: 'Notificações',  soon: true },
    { id: 'settings',      Icon: FaCog,            label: 'Configurações', soon: true },
  ];

  const SOON_SECTIONS = ['payment', 'favorites', 'coupons', 'notifications', 'settings'];
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
                <div className="mc-info-row"><span>Rastreio</span><strong className="mc-tracking">{order.trackingCode}</strong></div>
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

  function renderComingSoon() {
    const labels = { payment: 'Métodos de Pagamento', favorites: 'Favoritos', coupons: 'Cupons', notifications: 'Notificações', settings: 'Configurações' };
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

  return (
    <div className="mc-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mc-container container">
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
          {SOON_SECTIONS.includes(section)      && renderComingSoon()}
        </main>
      </div>
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
    </div>
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
