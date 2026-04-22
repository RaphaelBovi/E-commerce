import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCheck, FaLock, FaShieldAlt, FaCreditCard, FaMapMarkerAlt,
  FaShoppingCart, FaChevronRight, FaChevronLeft, FaSpinner,
  FaCheckCircle, FaTimesCircle, FaBarcode, FaQrcode,
} from 'react-icons/fa';
import { createCheckoutSession } from '../services/checkoutApi';
import { getUserProfile } from '../services/authApi';
import './Checkout.css';

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCpf = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const PAYMENT_METHODS = [
  { id: 'CREDIT_CARD', label: 'Cartão de Crédito', Icon: FaCreditCard,
    desc: 'Parcelamento em até 12x' },
  { id: 'PIX',         label: 'Pix',               Icon: FaQrcode,
    desc: 'Aprovação imediata' },
  { id: 'BOLETO',      label: 'Boleto Bancário',   Icon: FaBarcode,
    desc: 'Vence em 3 dias úteis' },
];

const STEPS = ['Carrinho', 'Entrega', 'Pagamento', 'Confirmação'];

// ─── CEP Lookup ───────────────────────────────────────────────────
async function fetchViaCep(cep) {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await res.json();
    return data.erro ? null : data;
  } catch {
    return null;
  }
}

// ─── Step Indicator ───────────────────────────────────────────────
function StepsBar({ current }) {
  return (
    <div className="chk-steps">
      {STEPS.map((label, i) => {
        const state = i + 1 < current ? 'done' : i + 1 === current ? 'active' : '';
        return (
          <React.Fragment key={label}>
            <div className={`chk-step ${state}`}>
              <div className="chk-step-dot">
                {i + 1 < current ? <FaCheck /> : i + 1}
              </div>
              <span className="chk-step-label">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`chk-step-line ${i + 1 < current ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Order Summary Sidebar ────────────────────────────────────────
function OrderSummary({ cartItems }) {
  const subtotal = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
  return (
    <aside className="chk-summary">
      <h3 className="chk-summary-title">Resumo do pedido</h3>
      <div className="chk-summary-items">
        {cartItems.map((item, i) => (
          <div key={i} className="chk-summary-item">
            <div className="chk-summary-item-img">
              {item.image
                ? <img src={item.image} alt={item.name} />
                : <FaShoppingCart />}
              <span className="chk-summary-qty">{item.quantity}</span>
            </div>
            <span className="chk-summary-item-name">{item.name}</span>
            <span className="chk-summary-item-price">{fmt(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="chk-summary-row">
        <span>Subtotal</span><span>{fmt(subtotal)}</span>
      </div>
      <div className="chk-summary-row">
        <span>Frete</span><span className="chk-free-shipping">Grátis</span>
      </div>
      <div className="chk-summary-total">
        <span>Total</span><span>{fmt(subtotal)}</span>
      </div>
      <div className="chk-summary-trust">
        <FaShieldAlt /> Compra 100% segura e protegida
      </div>
    </aside>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function Checkout({ cartItems, onClearCart }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Step 2 — Delivery address + recipient info
  const [address, setAddress] = useState({
    recipientName: '', recipientPhone: '', recipientPhone2: '', recipientCpf: '',
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  });
  const [cepLoading, setCepLoading] = useState(false);

  // Pre-fill delivery form from user profile on mount
  useEffect(() => {
    getUserProfile().then((profile) => {
      setAddress((prev) => ({
        ...prev,
        recipientName: profile.fullName || '',
        recipientPhone: profile.phone || '',
        recipientCpf: profile.cpf ? formatCpf(profile.cpf) : '',
        cep: profile.zipCode || '',
        cidade: profile.city || '',
        estado: profile.state || '',
        rua: profile.address || '',
      }));
    }).catch(() => {});
  }, []);

  // Step 3 — Payment method
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);

  // Redirect to catalog if cart is empty (only on steps 1-3)
  useEffect(() => {
    if (cartItems.length === 0 && step < 4) {
      navigate('/catalogo');
    }
  }, [cartItems, step, navigate]);

  const clearError = () => setError('');

  // ── Step 1 → 2 ──────────────────────────────────────────────────
  const goToDelivery = () => {
    clearError();
    setStep(2);
  };

  // ── CEP Auto-fill ────────────────────────────────────────────────
  const handleCepLookup = useCallback(async (rawCep) => {
    const digits = (rawCep || address.cep).replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    const data = await fetchViaCep(digits);
    if (data) {
      setAddress((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    } else {
      setError('CEP não encontrado. Preencha o endereço manualmente.');
    }
    setCepLoading(false);
  }, [address.cep]);

  // ── Step 2 → 3 ──────────────────────────────────────────────────
  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    clearError();
    const { recipientName, cep, rua, numero, cidade, estado } = address;
    if (!recipientName || !cep || !rua || !numero || !cidade || !estado) {
      setError('Preencha todos os campos obrigatórios do endereço.');
      return;
    }
    setStep(3);
  };

  // ── Payment submit → redirect to PagSeguro ───────────────────────
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsProcessing(true);
    try {
      const result = await createCheckoutSession({
        paymentMethod,
        recipientName: address.recipientName,
        recipientCpf: address.recipientCpf.replace(/\D/g, '') || null,
        recipientPhone: address.recipientPhone || null,
        recipientPhone2: address.recipientPhone2 || null,
        street: address.rua,
        streetNumber: address.numero,
        complement: address.complemento || null,
        neighborhood: address.bairro || null,
        city: address.cidade,
        state: address.estado,
        zipCode: address.cep.replace(/\D/g, ''),
        items: cartItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          productImage: item.image || null,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
      });
      onClearCart();
      // Briefly show redirecting state, then navigate to PagSeguro
      setStep(4);
      setTimeout(() => { window.location.href = result.paymentUrl; }, 1200);
    } catch (err) {
      setError(err.message || 'Erro ao criar sessão de pagamento. Tente novamente.');
      setIsProcessing(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="chk-page">
      <div className="chk-container">

        {/* ── Page header ── */}
        <div className="chk-header">
          <h1 className="chk-title">Finalizar compra</h1>
          <StepsBar current={step} />
        </div>

        {/* ── Step 4 — Redirecting to PagSeguro ── */}
        {step === 4 && (
          <div className="chk-confirmation">
            <div className="chk-result chk-result--redirecting">
              <FaSpinner className="chk-result-icon spin" />
              <h2>Redirecionando para o pagamento…</h2>
              <p>
                Você será enviado para a página segura do <strong>PagBank</strong> em instantes.<br />
                Não feche esta aba.
              </p>
            </div>
          </div>
        )}

        {/* ── Steps 1–3 layout (form + sidebar) ── */}
        {step < 4 && (
          <div className="chk-body">

            {/* ── Left: form area ── */}
            <div className="chk-form-area">

              {/* Global error banner */}
              {error && (
                <div className="chk-error" role="alert">
                  <FaTimesCircle /> {error}
                </div>
              )}

              {/* ── Step 1 — Cart review ── */}
              {step === 1 && (
                <div className="chk-card">
                  <div className="chk-card-header">
                    <FaShoppingCart className="chk-card-icon" />
                    <h2>Revise seu pedido</h2>
                  </div>
                  <div className="chk-cart-list">
                    {cartItems.map((item, i) => (
                      <div key={i} className="chk-cart-item">
                        <div className="chk-cart-item-img">
                          {item.image
                            ? <img src={item.image} alt={item.name} />
                            : <FaShoppingCart />}
                        </div>
                        <div className="chk-cart-item-info">
                          <p className="chk-cart-item-name">{item.name}</p>
                          <p className="chk-cart-item-qty">Quantidade: {item.quantity}</p>
                          <p className="chk-cart-item-unit">
                            {fmt(item.price)} / unidade
                          </p>
                        </div>
                        <div className="chk-cart-item-total">{fmt(item.price * item.quantity)}</div>
                      </div>
                    ))}
                  </div>
                  <button className="btn-gold chk-continue-btn" onClick={goToDelivery}>
                    Continuar para entrega <FaChevronRight />
                  </button>
                </div>
              )}

              {/* ── Step 2 — Delivery address ── */}
              {step === 2 && (
                <div className="chk-card">
                  <div className="chk-card-header">
                    <FaMapMarkerAlt className="chk-card-icon" />
                    <h2>Endereço de entrega</h2>
                  </div>
                  <form className="chk-form" onSubmit={handleDeliverySubmit} noValidate>

                    <div className="chk-field-row">
                      <div className="chk-field chk-field--grow">
                        <label htmlFor="chk-recipient">Nome do destinatário <span className="req">*</span></label>
                        <input
                          id="chk-recipient" type="text"
                          placeholder="Quem vai receber o pedido"
                          value={address.recipientName}
                          onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="chk-field chk-field--sm">
                        <label htmlFor="chk-recphone">Telefone principal</label>
                        <input
                          id="chk-recphone" type="tel" inputMode="numeric"
                          placeholder="(11) 99999-9999"
                          value={address.recipientPhone}
                          onChange={(e) => setAddress({ ...address, recipientPhone: e.target.value })}
                        />
                      </div>
                      <div className="chk-field chk-field--sm">
                        <label htmlFor="chk-recphone2">Telefone secundário</label>
                        <input
                          id="chk-recphone2" type="tel" inputMode="numeric"
                          placeholder="(11) 99999-9999"
                          value={address.recipientPhone2}
                          onChange={(e) => setAddress({ ...address, recipientPhone2: e.target.value })}
                        />
                      </div>
                      <div className="chk-field chk-field--sm">
                        <label htmlFor="chk-reccpf">CPF do destinatário</label>
                        <input
                          id="chk-reccpf" type="text" inputMode="numeric"
                          placeholder="000.000.000-00" maxLength={14}
                          value={address.recipientCpf}
                          onChange={(e) => setAddress({ ...address, recipientCpf: formatCpf(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="chk-field-divider" />

                    <div className="chk-field-row">
                      <div className="chk-field chk-field--sm">
                        <label htmlFor="chk-cep">CEP <span className="req">*</span></label>
                        <div className="chk-cep-wrap">
                          <input
                            id="chk-cep" type="text" inputMode="numeric"
                            placeholder="00000-000" maxLength={9}
                            value={address.cep}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddress({ ...address, cep: val });
                              if (val.replace(/\D/g, '').length === 8) handleCepLookup(val);
                            }}
                          />
                          {cepLoading && <FaSpinner className="chk-cep-spinner spin" />}
                        </div>
                      </div>
                    </div>

                    <div className="chk-field-row">
                      <div className="chk-field chk-field--grow">
                        <label htmlFor="chk-rua">Rua / Logradouro <span className="req">*</span></label>
                        <input id="chk-rua" type="text"
                          value={address.rua}
                          onChange={(e) => setAddress({ ...address, rua: e.target.value })} />
                      </div>
                      <div className="chk-field chk-field--sm">
                        <label htmlFor="chk-num">Número <span className="req">*</span></label>
                        <input id="chk-num" type="text"
                          value={address.numero}
                          onChange={(e) => setAddress({ ...address, numero: e.target.value })} />
                      </div>
                    </div>

                    <div className="chk-field-row">
                      <div className="chk-field chk-field--grow">
                        <label htmlFor="chk-comp">Complemento</label>
                        <input id="chk-comp" type="text" placeholder="Apto, bloco, etc."
                          value={address.complemento}
                          onChange={(e) => setAddress({ ...address, complemento: e.target.value })} />
                      </div>
                      <div className="chk-field chk-field--grow">
                        <label htmlFor="chk-bairro">Bairro</label>
                        <input id="chk-bairro" type="text"
                          value={address.bairro}
                          onChange={(e) => setAddress({ ...address, bairro: e.target.value })} />
                      </div>
                    </div>

                    <div className="chk-field-row">
                      <div className="chk-field chk-field--grow">
                        <label htmlFor="chk-city">Cidade <span className="req">*</span></label>
                        <input id="chk-city" type="text"
                          value={address.cidade}
                          onChange={(e) => setAddress({ ...address, cidade: e.target.value })} />
                      </div>
                      <div className="chk-field chk-field--xs">
                        <label htmlFor="chk-uf">Estado <span className="req">*</span></label>
                        <input id="chk-uf" type="text" maxLength={2} placeholder="UF"
                          value={address.estado}
                          onChange={(e) => setAddress({ ...address, estado: e.target.value.toUpperCase() })} />
                      </div>
                    </div>

                    <div className="chk-form-actions">
                      <button type="button" className="chk-btn-ghost" onClick={() => setStep(1)}>
                        <FaChevronLeft /> Voltar
                      </button>
                      <button type="submit" className="btn-gold">
                        Continuar para pagamento <FaChevronRight />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Step 3 — Payment method selection ── */}
              {step === 3 && (
                <div className="chk-card">
                  <div className="chk-card-header">
                    <FaLock className="chk-card-icon" />
                    <h2>Forma de pagamento</h2>
                    <div className="chk-pagseguro-badge">
                      Processado pelo <strong>PagBank</strong>
                    </div>
                  </div>

                  <p className="chk-payment-hint">
                    Escolha como prefere pagar. Você será redirecionado para a página segura do PagBank para concluir.
                  </p>

                  <div className="chk-payment-methods">
                    {PAYMENT_METHODS.map(({ id, label, Icon, desc }) => (
                      <button
                        key={id}
                        type="button"
                        className={`chk-method-card ${paymentMethod === id ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod(id)}
                      >
                        <Icon className="chk-method-icon" />
                        <div>
                          <span className="chk-method-label">{label}</span>
                          <span className="chk-method-desc">{desc}</span>
                        </div>
                        <div className="chk-method-check">
                          {paymentMethod === id && <FaCheckCircle />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="chk-security-seal">
                    <FaShieldAlt /> Ambiente 100% seguro — seus dados são protegidos pelo PagBank
                  </div>

                  <form onSubmit={handlePaymentSubmit}>
                    <div className="chk-form-actions">
                      <button type="button" className="chk-btn-ghost"
                        onClick={() => setStep(2)} disabled={isProcessing}>
                        <FaChevronLeft /> Voltar
                      </button>
                      <button type="submit" className="btn-gold chk-pay-btn" disabled={isProcessing}>
                        {isProcessing
                          ? <><FaSpinner className="spin" /> Aguarde…</>
                          : <><FaLock /> Ir para o pagamento · {fmt(total)}</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* ── Right: sticky summary ── */}
            <OrderSummary cartItems={cartItems} />
          </div>
        )}
      </div>
    </div>
  );
}
