import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  FaCheck, FaLock, FaShieldAlt, FaCreditCard, FaMapMarkerAlt,
  FaShoppingCart, FaChevronRight, FaChevronLeft, FaSpinner,
  FaTimesCircle, FaBarcode, FaQrcode, FaUser, FaStore,
} from 'react-icons/fa';
import { createCheckoutSession } from '../services/checkoutApi';
import { getUserProfile } from '../services/authApi';
import './Checkout.css';

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCpf = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const RECAPTCHA_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

const PAYMENT_METHODS = [
  {
    id: 'CREDIT_CARD',
    label: 'Cartão de Crédito',
    desc: 'Parcele em até 12×',
    Icon: FaCreditCard,
  },
  {
    id: 'PIX',
    label: 'Pix',
    desc: 'Aprovação imediata',
    Icon: FaQrcode,
  },
  {
    id: 'BOLETO',
    label: 'Boleto Bancário',
    desc: 'Vence em 3 dias úteis',
    Icon: FaBarcode,
  },
];

const STEPS = ['Carrinho', 'Entrega', 'Pagamento', 'Confirmação'];

// ─── CEP lookup ────────────────────────────────────────────────────
async function fetchViaCep(cep) {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    return data.erro ? null : data;
  } catch {
    return null;
  }
}

// ─── Steps bar ─────────────────────────────────────────────────────
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

// ─── Sidebar ────────────────────────────────────────────────────────
function OrderSummary({ cartItems }) {
  const subtotal = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
  return (
    <aside className="chk-summary">
      <div className="chk-summary-head">Resumo do pedido</div>
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
      <div className="chk-summary-totals">
        <div className="chk-summary-row">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="chk-summary-row">
          <span>Frete</span>
          <span className="chk-free-shipping">Grátis</span>
        </div>
        <div className="chk-summary-sep" />
        <div className="chk-summary-total">
          <span>Total</span>
          <span>{fmt(subtotal)}</span>
        </div>
      </div>
      <div className="chk-summary-trust">
        <FaShieldAlt />
        Compra 100% segura e protegida
      </div>
    </aside>
  );
}

// ─── Main component ─────────────────────────────────────────────────
export default function Checkout({ cartItems, onClearCart }) {
  const navigate    = useNavigate();
  const captchaRef  = useRef(null);
  const [step, setStep]               = useState(1);
  const [error, setError]             = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Step 2 — address + recipient
  const [address, setAddress] = useState({
    recipientName:  '',
    recipientCpf:   '',
    recipientPhone:  '',
    recipientPhone2: '',
    cep:       '',
    rua:       '',
    numero:    '',
    complemento: '',
    bairro:    '',
    cidade:    '',
    estado:    '',
  });
  const [cepLoading, setCepLoading] = useState(false);

  // Step 3 — payment
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [isProcessing,  setIsProcessing]  = useState(false);

  const total = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);

  // Pre-fill from user profile
  useEffect(() => {
    getUserProfile().then((p) => {
      setAddress((prev) => ({
        ...prev,
        recipientName:  p.fullName  || '',
        recipientPhone: p.phone     || '',
        recipientCpf:   p.cpf ? formatCpf(p.cpf) : '',
        cep:    p.zipCode || '',
        cidade: p.city    || '',
        estado: p.state   || '',
        rua:    p.address || '',
      }));
    }).catch(() => {});
  }, []);

  // Empty cart guard
  useEffect(() => {
    if (cartItems.length === 0 && step < 4) navigate('/catalogo');
  }, [cartItems, step, navigate]);

  const clearError = () => setError('');

  // ── CEP auto-fill ───────────────────────────────────────────────
  const handleCepLookup = useCallback(async (raw) => {
    const digits = (raw || address.cep).replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    const data = await fetchViaCep(digits);
    if (data) {
      setAddress((prev) => ({
        ...prev,
        rua:    data.logradouro || prev.rua,
        bairro: data.bairro     || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf         || prev.estado,
      }));
    } else {
      setError('CEP não encontrado. Preencha o endereço manualmente.');
    }
    setCepLoading(false);
  }, [address.cep]);

  // ── Step 1 → 2 ─────────────────────────────────────────────────
  const goToDelivery = () => { clearError(); setStep(2); };

  // ── Step 2 → 3 ─────────────────────────────────────────────────
  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    clearError();
    const { recipientName, recipientPhone, cep, rua, numero, cidade, estado } = address;
    if (!recipientName)  { setError('Informe o nome do destinatário.');  return; }
    if (!recipientPhone) { setError('Informe o telefone principal.');    return; }
    if (!cep || !rua || !numero || !cidade || !estado) {
      setError('Preencha todos os campos obrigatórios do endereço.');
      return;
    }
    setStep(3);
  };

  // ── Step 3 → checkout ───────────────────────────────────────────
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setCaptchaError('');

    if (RECAPTCHA_KEY && !captchaToken) {
      setCaptchaError('Por favor, confirme que você não é um robô.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createCheckoutSession({
        paymentMethod,
        recipientName:  address.recipientName,
        recipientCpf:   address.recipientCpf.replace(/\D/g, '') || null,
        recipientPhone:  address.recipientPhone  || null,
        recipientPhone2: address.recipientPhone2 || null,
        street:       address.rua,
        streetNumber: address.numero,
        complement:   address.complemento || null,
        neighborhood: address.bairro      || null,
        city:  address.cidade,
        state: address.estado,
        zipCode: address.cep.replace(/\D/g, ''),
        items: cartItems.map((item) => ({
          productId:    item.id,
          productName:  item.name,
          productImage: item.image || null,
          unitPrice:    item.price,
          quantity:     item.quantity,
        })),
      }, captchaToken);

      onClearCart();
      setStep(4);
      setTimeout(() => { window.location.href = result.paymentUrl; }, 1400);
    } catch (err) {
      setError(err.message || 'Erro ao criar sessão de pagamento. Tente novamente.');
      captchaRef.current?.reset();
      setCaptchaToken('');
      setIsProcessing(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="chk-page">
      <div className="chk-container">

        {/* Header */}
        <div className="chk-header">
          <h1 className="chk-title">Finalizar compra</h1>
          <StepsBar current={step} />
        </div>

        {/* Step 4 — redirecting */}
        {step === 4 && (
          <div className="chk-redirect-wrap">
            <div className="chk-redirect">
              <div className="chk-redirect-icon">
                <FaSpinner className="spin" />
              </div>
              <h2>Redirecionando para o pagamento…</h2>
              <p>
                Você será enviado para a página segura do <strong>PagBank</strong> em instantes.
                Não feche esta aba.
              </p>
            </div>
          </div>
        )}

        {/* Steps 1–3 */}
        {step < 4 && (
          <div className="chk-body">

            {/* Left column */}
            <div className="chk-form-area">

              {/* Error banner */}
              {error && (
                <div className="chk-error" role="alert">
                  <FaTimesCircle /> {error}
                </div>
              )}

              {/* ── Step 1: Cart review ── */}
              {step === 1 && (
                <div className="chk-card">
                  <div className="chk-section">
                    <div className="chk-section-header">
                      <div className="chk-section-icon"><FaShoppingCart /></div>
                      <span className="chk-section-title">Revise seu pedido</span>
                      <span className="chk-section-badge">{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</span>
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
                            <div className="chk-cart-item-meta">
                              <span className="chk-cart-badge">Qtd: {item.quantity}</span>
                              <span className="chk-cart-item-unit">{fmt(item.price)} / un.</span>
                            </div>
                          </div>
                          <div className="chk-cart-item-total">{fmt(item.price * item.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="chk-actions">
                    <Link to="/catalogo" className="chk-btn-ghost">
                      <FaChevronLeft /> Continuar comprando
                    </Link>
                    <button className="chk-btn-primary" onClick={goToDelivery}>
                      Informar entrega <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Delivery ── */}
              {step === 2 && (
                <form className="chk-card" onSubmit={handleDeliverySubmit} noValidate>

                  {/* Recipient section */}
                  <div className="chk-section">
                    <div className="chk-section-header">
                      <div className="chk-section-icon"><FaUser /></div>
                      <span className="chk-section-title">Dados do destinatário</span>
                    </div>
                    <div className="chk-form">
                      <div className="chk-field">
                        <label htmlFor="chk-rname">Nome completo <span className="req">*</span></label>
                        <input
                          id="chk-rname" type="text"
                          placeholder="Quem vai receber o pedido"
                          value={address.recipientName}
                          onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="chk-field-row">
                        <div className="chk-field chk-field--grow">
                          <label htmlFor="chk-rcpf">CPF</label>
                          <input
                            id="chk-rcpf" type="text" inputMode="numeric"
                            placeholder="000.000.000-00" maxLength={14}
                            value={address.recipientCpf}
                            onChange={(e) => setAddress({ ...address, recipientCpf: formatCpf(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="chk-field-row">
                        <div className="chk-field chk-field--grow">
                          <label htmlFor="chk-rphone">Telefone principal <span className="req">*</span></label>
                          <input
                            id="chk-rphone" type="tel" inputMode="numeric"
                            placeholder="(11) 99999-9999"
                            value={address.recipientPhone}
                            onChange={(e) => setAddress({ ...address, recipientPhone: e.target.value })}
                            required
                          />
                        </div>
                        <div className="chk-field chk-field--sm">
                          <label htmlFor="chk-rphone2">
                            Telefone 2 <span className="chk-opt">(Opcional)</span>
                          </label>
                          <input
                            id="chk-rphone2" type="tel" inputMode="numeric"
                            placeholder="(11) 99999-9999"
                            value={address.recipientPhone2}
                            onChange={(e) => setAddress({ ...address, recipientPhone2: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address section */}
                  <div className="chk-section">
                    <div className="chk-section-header">
                      <div className="chk-section-icon"><FaMapMarkerAlt /></div>
                      <span className="chk-section-title">Endereço de entrega</span>
                    </div>
                    <div className="chk-form">
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
                        <div className="chk-field chk-field--grow">
                          <label htmlFor="chk-bairro">Bairro</label>
                          <input
                            id="chk-bairro" type="text"
                            value={address.bairro}
                            onChange={(e) => setAddress({ ...address, bairro: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="chk-field-row">
                        <div className="chk-field chk-field--grow">
                          <label htmlFor="chk-rua">Rua / Logradouro <span className="req">*</span></label>
                          <input
                            id="chk-rua" type="text"
                            value={address.rua}
                            onChange={(e) => setAddress({ ...address, rua: e.target.value })}
                          />
                        </div>
                        <div className="chk-field chk-field--xs">
                          <label htmlFor="chk-num">Número <span className="req">*</span></label>
                          <input
                            id="chk-num" type="text"
                            value={address.numero}
                            onChange={(e) => setAddress({ ...address, numero: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="chk-field">
                        <label htmlFor="chk-comp">
                          Complemento <span className="chk-opt">(Opcional)</span>
                        </label>
                        <input
                          id="chk-comp" type="text"
                          placeholder="Apto, bloco, sala…"
                          value={address.complemento}
                          onChange={(e) => setAddress({ ...address, complemento: e.target.value })}
                        />
                      </div>
                      <div className="chk-field-row">
                        <div className="chk-field chk-field--grow">
                          <label htmlFor="chk-city">Cidade <span className="req">*</span></label>
                          <input
                            id="chk-city" type="text"
                            value={address.cidade}
                            onChange={(e) => setAddress({ ...address, cidade: e.target.value })}
                          />
                        </div>
                        <div className="chk-field chk-field--xs">
                          <label htmlFor="chk-uf">Estado <span className="req">*</span></label>
                          <input
                            id="chk-uf" type="text" maxLength={2} placeholder="UF"
                            value={address.estado}
                            onChange={(e) => setAddress({ ...address, estado: e.target.value.toUpperCase() })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="chk-actions">
                    <button type="button" className="chk-btn-ghost" onClick={() => setStep(1)}>
                      <FaChevronLeft /> Voltar
                    </button>
                    <button type="submit" className="chk-btn-primary">
                      Escolher pagamento <FaChevronRight />
                    </button>
                  </div>
                </form>
              )}

              {/* ── Step 3: Payment ── */}
              {step === 3 && (
                <form className="chk-card" onSubmit={handlePaymentSubmit}>

                  <div className="chk-section">
                    <div className="chk-section-header">
                      <div className="chk-section-icon"><FaLock /></div>
                      <span className="chk-section-title">Forma de pagamento</span>
                      <span className="chk-section-badge">via PagBank</span>
                    </div>

                    <p className="chk-payment-hint">
                      Você será redirecionado para a página segura do PagBank para concluir o pagamento.
                    </p>

                    <div className="chk-payment-methods">
                      {PAYMENT_METHODS.map(({ id, label, Icon, desc }) => (
                        <button
                          key={id}
                          type="button"
                          className={`chk-method-card ${paymentMethod === id ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod(id)}
                        >
                          <div className="chk-method-icon-wrap"><Icon /></div>
                          <div className="chk-method-info">
                            <span className="chk-method-label">{label}</span>
                            <span className="chk-method-desc">{desc}</span>
                          </div>
                          <div className="chk-method-radio" />
                        </button>
                      ))}
                    </div>

                    <div className="chk-security-seal">
                      <FaShieldAlt /> Ambiente 100% seguro — seus dados são protegidos pelo PagBank
                    </div>

                    {/* CAPTCHA */}
                    {RECAPTCHA_KEY ? (
                      <div className="chk-captcha">
                        <ReCAPTCHA
                          ref={captchaRef}
                          sitekey={RECAPTCHA_KEY}
                          onChange={(token) => { setCaptchaToken(token || ''); setCaptchaError(''); }}
                          onExpired={() => setCaptchaToken('')}
                        />
                        {captchaError && (
                          <span className="chk-captcha-error">{captchaError}</span>
                        )}
                      </div>
                    ) : (
                      <div className="chk-captcha">
                        <span className="chk-captcha-skip">
                          (CAPTCHA desativado — configure VITE_RECAPTCHA_SITE_KEY para ativar)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="chk-actions">
                    <button
                      type="button"
                      className="chk-btn-ghost"
                      onClick={() => setStep(2)}
                      disabled={isProcessing}
                    >
                      <FaChevronLeft /> Voltar
                    </button>
                    <button
                      type="submit"
                      className="chk-btn-primary"
                      disabled={isProcessing || (RECAPTCHA_KEY && !captchaToken)}
                    >
                      {isProcessing
                        ? <><FaSpinner className="spin" /> Aguarde…</>
                        : <><FaLock /> Ir para o pagamento · {fmt(total)}</>}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <OrderSummary cartItems={cartItems} />
          </div>
        )}
      </div>
    </div>
  );
}
