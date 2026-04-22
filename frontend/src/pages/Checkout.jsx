import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCheck, FaLock, FaShieldAlt, FaCreditCard, FaMapMarkerAlt,
  FaShoppingCart, FaChevronRight, FaChevronLeft, FaSpinner,
  FaCheckCircle, FaTimesCircle, FaExclamationCircle,
} from 'react-icons/fa';
import { getPagseguroPublicKey, processCheckout } from '../services/checkoutApi';
import './Checkout.css';

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCardNumber = (v) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const getCardBrand = (number) => {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return null;
};

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

  // Step 2 — Delivery address
  const [address, setAddress] = useState({
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  });
  const [cepLoading, setCepLoading] = useState(false);

  // Step 3 — Payment
  const [card, setCard] = useState({
    number: '', holder: '', expiry: '', cvv: '', installments: 1,
  });
  const [publicKey, setPublicKey] = useState(null);
  const [pkError, setPkError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 4 — Result
  const [orderResult, setOrderResult] = useState(null);

  const total = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);

  // Fetch PagSeguro public key when user reaches payment step
  useEffect(() => {
    if (step !== 3) return;
    getPagseguroPublicKey()
      .then((data) => setPublicKey(data.publicKey))
      .catch(() => setPkError(true));
  }, [step]);

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
  const handleCepLookup = useCallback(async () => {
    setCepLoading(true);
    const data = await fetchViaCep(address.cep);
    if (data) {
      setAddress((prev) => ({
        ...prev,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
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
    const { cep, rua, numero, cidade, estado } = address;
    if (!cep || !rua || !numero || !cidade || !estado) {
      setError('Preencha todos os campos obrigatórios do endereço.');
      return;
    }
    setStep(3);
  };

  // ── Payment submit ───────────────────────────────────────────────
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!window.PagSeguro) {
      setError('Módulo de pagamento não carregado. Recarregue a página e tente novamente.');
      return;
    }
    if (!publicKey) {
      setError('Chave de pagamento não disponível. Tente novamente em instantes.');
      return;
    }

    const [expMonth, expYear] = card.expiry.split('/');
    if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length !== 2) {
      setError('Data de validade inválida. Use o formato MM/AA.');
      return;
    }

    // Encrypt card data with PagSeguro JS SDK
    const encrypted = window.PagSeguro.encryptCard({
      publicKey,
      holder: card.holder.trim().toUpperCase(),
      number: card.number.replace(/\s/g, ''),
      expMonth,
      expYear: `20${expYear}`,
      securityCode: card.cvv,
    });

    if (encrypted.hasErrors) {
      const messages = encrypted.errors.map((err) => {
        const map = {
          INVALID_NUMBER: 'Número do cartão inválido',
          INVALID_SECURITY_CODE: 'CVV inválido',
          INVALID_EXPIRATION_MONTH: 'Mês de validade inválido',
          INVALID_EXPIRATION_YEAR: 'Ano de validade inválido',
          INVALID_HOLDER: 'Nome do titular inválido',
        };
        return map[err.code] || 'Dado do cartão inválido';
      });
      setError(messages.join(' · '));
      return;
    }

    const deliveryAddress = [
      address.rua, address.numero,
      address.complemento, address.bairro,
      address.cidade, address.estado,
      address.cep,
    ].filter(Boolean).join(', ');

    setIsProcessing(true);
    try {
      const result = await processCheckout({
        encryptedCard: encrypted.encryptedCard,
        holderName: card.holder.trim().toUpperCase(),
        installments: parseInt(card.installments, 10),
        deliveryAddress,
        items: cartItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          productImage: item.image || null,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
      });

      setOrderResult(result);
      setStep(4);
      if (result.success) {
        onClearCart();
      }
    } catch (err) {
      setError(err.message || 'Erro ao processar pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Installment options ──────────────────────────────────────────
  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return { value: n, label: `${n}x de ${fmt(total / n)} sem juros` };
  });

  const cardBrand = getCardBrand(card.number);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="chk-page">
      <div className="chk-container">

        {/* ── Page header ── */}
        <div className="chk-header">
          <h1 className="chk-title">Finalizar compra</h1>
          <StepsBar current={step} />
        </div>

        {/* ── Step 4 — Confirmation (full-width, no sidebar) ── */}
        {step === 4 && orderResult && (
          <div className="chk-confirmation">
            {orderResult.success ? (
              orderResult.paymentStatus === 'IN_ANALYSIS' ? (
                <div className="chk-result chk-result--analysis">
                  <FaExclamationCircle className="chk-result-icon" />
                  <h2>Pagamento em análise</h2>
                  <p>{orderResult.message}</p>
                </div>
              ) : (
                <div className="chk-result chk-result--success">
                  <FaCheckCircle className="chk-result-icon" />
                  <h2>Pedido confirmado!</h2>
                  <p>{orderResult.message}</p>
                </div>
              )
            ) : (
              <div className="chk-result chk-result--declined">
                <FaTimesCircle className="chk-result-icon" />
                <h2>Pagamento não aprovado</h2>
                <p>{orderResult.message}</p>
              </div>
            )}

            {orderResult.orderId && (
              <div className="chk-order-ref">
                <span>Pedido</span>
                <strong>#{orderResult.orderId.toString().substring(0, 8).toUpperCase()}</strong>
              </div>
            )}

            <div className="chk-confirmation-amount">
              <span>Total cobrado</span>
              <strong>{fmt(orderResult.totalAmount)}</strong>
            </div>

            <div className="chk-confirmation-actions">
              <Link to="/minha-conta" className="btn-gold">Ver meus pedidos</Link>
              <Link to="/" className="chk-btn-ghost">Continuar comprando</Link>
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
                      <div className="chk-field chk-field--sm">
                        <label htmlFor="chk-cep">CEP <span className="req">*</span></label>
                        <div className="chk-cep-wrap">
                          <input
                            id="chk-cep" type="text" inputMode="numeric"
                            placeholder="00000-000" maxLength={9}
                            value={address.cep}
                            onChange={(e) => setAddress({ ...address, cep: e.target.value })}
                            onBlur={handleCepLookup}
                          />
                          <button type="button" className="chk-cep-btn" onClick={handleCepLookup}
                            disabled={cepLoading}>
                            {cepLoading ? <FaSpinner className="spin" /> : 'Buscar'}
                          </button>
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

              {/* ── Step 3 — Payment ── */}
              {step === 3 && (
                <div className="chk-card">
                  <div className="chk-card-header">
                    <FaCreditCard className="chk-card-icon" />
                    <h2>Dados do cartão</h2>
                    <div className="chk-pagseguro-badge">
                      Processado pelo <strong>PagBank</strong>
                    </div>
                  </div>

                  {pkError && (
                    <div className="chk-error">
                      <FaTimesCircle /> Módulo de pagamento indisponível. Verifique sua conexão e recarregue a página.
                    </div>
                  )}

                  <form className="chk-form" onSubmit={handlePaymentSubmit} noValidate>

                    {/* Card number */}
                    <div className="chk-field">
                      <label htmlFor="chk-card-num">Número do cartão <span className="req">*</span></label>
                      <div className="chk-card-num-wrap">
                        <input
                          id="chk-card-num" type="text" inputMode="numeric"
                          placeholder="0000 0000 0000 0000"
                          value={card.number}
                          onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                          maxLength={19} autoComplete="cc-number" required
                        />
                        {cardBrand && (
                          <span className={`chk-card-brand chk-card-brand--${cardBrand}`}>{cardBrand}</span>
                        )}
                      </div>
                    </div>

                    {/* Holder name */}
                    <div className="chk-field">
                      <label htmlFor="chk-holder">Nome impresso no cartão <span className="req">*</span></label>
                      <input
                        id="chk-holder" type="text" placeholder="NOME SOBRENOME"
                        value={card.holder}
                        onChange={(e) => setCard({ ...card, holder: e.target.value.toUpperCase() })}
                        autoComplete="cc-name" required
                      />
                    </div>

                    {/* Expiry + CVV */}
                    <div className="chk-field-row">
                      <div className="chk-field chk-field--sm">
                        <label htmlFor="chk-expiry">Validade <span className="req">*</span></label>
                        <input
                          id="chk-expiry" type="text" inputMode="numeric"
                          placeholder="MM/AA" maxLength={5}
                          value={card.expiry}
                          onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                          autoComplete="cc-exp" required
                        />
                      </div>
                      <div className="chk-field chk-field--sm">
                        <label htmlFor="chk-cvv">
                          CVV <span className="req">*</span>
                          <span className="chk-cvv-hint">(3 ou 4 dígitos)</span>
                        </label>
                        <input
                          id="chk-cvv" type="text" inputMode="numeric"
                          placeholder="•••" maxLength={4}
                          value={card.cvv}
                          onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          autoComplete="cc-csc" required
                        />
                      </div>
                    </div>

                    {/* Installments */}
                    <div className="chk-field">
                      <label htmlFor="chk-parcelas">Parcelas <span className="req">*</span></label>
                      <select
                        id="chk-parcelas"
                        value={card.installments}
                        onChange={(e) => setCard({ ...card, installments: e.target.value })}
                      >
                        {installmentOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Security seal */}
                    <div className="chk-security-seal">
                      <FaLock /> Seus dados são criptografados com segurança pelo PagBank
                    </div>

                    <div className="chk-form-actions">
                      <button type="button" className="chk-btn-ghost"
                        onClick={() => setStep(2)} disabled={isProcessing}>
                        <FaChevronLeft /> Voltar
                      </button>
                      <button type="submit" className="btn-gold chk-pay-btn" disabled={isProcessing || pkError}>
                        {isProcessing
                          ? <><FaSpinner className="spin" /> Processando…</>
                          : <><FaLock /> Finalizar compra · {fmt(total)}</>}
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
