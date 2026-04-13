import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

const storeName = import.meta.env.VITE_STORE_NAME || 'Sua loja';
const brevoSenderEmail = import.meta.env.VITE_BREVO_SENDER_EMAIL || 'noreply@seudominio.com';

export default function Checkout({ cartItems, onClearCart }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    rua: '',
    numero: '',
    cep: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const valorTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFinalizarCompra = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    setIsSubmitting(true);

    const itensHTML = cartItems
      .map((item) => `<li>${item.quantity}× ${item.name} — R$ ${item.price.toFixed(2)}</li>`)
      .join('');
    const conteudoHtml = `
      <div style="font-family: system-ui, sans-serif; color: #334155;">
        <h2 style="color: #2563eb;">Pedido registrado, ${formData.nome}!</h2>
        <p>Recebemos os dados do seu pedido em <strong>${storeName}</strong>.</p>
        <p><strong>Entrega:</strong> ${formData.rua}, ${formData.numero} — CEP ${formData.cep}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0;" />
        <h3 style="margin: 0 0 0.5rem;">Itens</h3>
        <ul style="padding-left: 1.2rem;">${itensHTML}</ul>
        <p style="font-size: 1.1rem; font-weight: 700; color: #1e293b;">Total: R$ ${valorTotal.toFixed(2)}</p>
      </div>
    `;

    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: storeName, email: brevoSenderEmail },
          to: [{ email: formData.email, name: formData.nome }],
          subject: `${storeName} — confirmação do pedido`,
          htmlContent: conteudoHtml,
        },
        {
          headers: {
            accept: 'application/json',
            'api-key': import.meta.env.VITE_BREVO_API_KEY,
            'content-type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.warn('E-mail não enviado. Verifique VITE_BREVO_API_KEY e VITE_BREVO_SENDER_EMAIL.', error);
    }

    setSuccessMessage('Pedido finalizado! Obrigado pela preferência.');
    onClearCart();
    setTimeout(() => navigate('/'), 4000);
    setIsSubmitting(false);
  };

  if (successMessage) {
    return (
      <main className="container checkout-page success-container">
        <h2>Tudo certo</h2>
        <p>{successMessage}</p>
      </main>
    );
  }

  return (
    <main className="container checkout-page">
      <h1>Finalizar <span className="highlight-text">pedido</span></h1>
      <p className="checkout-lead">Preencha os dados para entrega e confirmação. Ajuste integrações no template.</p>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleFinalizarCompra}>
          <h3>Contato e entrega</h3>
          <div className="input-group">
            <label htmlFor="chk-nome">Nome completo</label>
            <input id="chk-nome" type="text" name="nome" required value={formData.nome} onChange={handleInputChange} />
          </div>
          <div className="input-group">
            <label htmlFor="chk-email">E-mail</label>
            <input id="chk-email" type="email" name="email" required value={formData.email} onChange={handleInputChange} />
          </div>
          <div className="input-group">
            <label htmlFor="chk-tel">Telefone</label>
            <input id="chk-tel" type="text" name="telefone" required value={formData.telefone} onChange={handleInputChange} />
          </div>
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="chk-cep">CEP</label>
              <input id="chk-cep" type="text" name="cep" required value={formData.cep} onChange={handleInputChange} />
            </div>
            <div className="input-group flex-2">
              <label htmlFor="chk-rua">Rua</label>
              <input id="chk-rua" type="text" name="rua" required value={formData.rua} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label htmlFor="chk-num">Número</label>
              <input id="chk-num" type="text" name="numero" required value={formData.numero} onChange={handleInputChange} />
            </div>
          </div>

          <button type="submit" className="btn-finalizar" disabled={isSubmitting || cartItems.length === 0}>
            {isSubmitting ? 'Processando…' : 'Confirmar pedido'}
          </button>
        </form>

        <aside className="checkout-summary">
          <h3>Resumo</h3>
          {cartItems.length === 0 ? (
            <p className="summary-empty">Carrinho vazio.</p>
          ) : (
            <div className="summary-items">
              {cartItems.map((item, index) => (
                <div key={index} className="summary-item">
                  <span>{item.quantity}× {item.name}</span>
                  <strong>R$ {(item.price * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
              <div className="summary-total">
                <span>Total</span>
                <span className="highlight-text">R$ {valorTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
