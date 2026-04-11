import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

export default function Checkout({ cartItems, onClearCart }) {
    const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', rua: '', numero: '', cep: '' });
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
            alert("Seu carrinho está vazio!");
            return;
        }

        setIsSubmitting(true);

        const itensHTML = cartItems.map(item => `<li>${item.quantity}x ${item.name} - R$ ${item.price.toFixed(2)}</li>`).join('');
        const conteudoHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #dca200;">Pedido Confirmado, ${formData.nome}!</h2>
        <p>Recebemos o seu pedido com sucesso na Pastractor.</p>
        <p><strong>Endereço de Entrega:</strong> ${formData.rua}, ${formData.numero} - CEP: ${formData.cep}</p>
        <hr/>
        <h3>Resumo das Peças:</h3>
        <ul>${itensHTML}</ul>
        <h3 style="color: #b45309;">Valor Total: R$ ${valorTotal.toFixed(2)}</h3>
      </div>
    `;

        try {
            await axios.post(
                'https://api.brevo.com/v3/smtp/email',
                {
                    sender: { name: "Pastractor", email: "wansanice@gmail.com" },
                    to: [{ email: formData.email, name: formData.nome }],
                    subject: `Pastractor - Confirmação do Pedido`,
                    htmlContent: conteudoHtml
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'api-key': import.meta.env.VITE_BREVO_API_KEY,
                        'content-type': 'application/json'
                    }
                }
            );
            console.log("E-mail enviado com sucesso pela Brevo!");
        } catch (error) {
            console.warn("Aviso: O e-mail não foi enviado. Verifique a API Key ou o remetente na Brevo.", error);
        }

        setSuccessMessage("Pedido finalizado! Obrigado por comprar conosco.");
        onClearCart();
        setTimeout(() => navigate('/'), 4000);
        setIsSubmitting(false);
    };

    if (successMessage) {
        return (
            <main className="container checkout-page success-container">
                <h2>Sucesso!</h2>
                <p>{successMessage}</p>
            </main>
        );
    }

    return (
        <main className="container checkout-page">
            <h1>Finalizar <span className="highlight-text">Compra</span></h1>

            <div className="checkout-grid">
                <form className="checkout-form" onSubmit={handleFinalizarCompra}>
                    <h3>Dados de Contato e Entrega</h3>
                    <div className="input-group">
                        <label>Nome Completo</label>
                        <input type="text" name="nome" required value={formData.nome} onChange={handleInputChange} />
                    </div>
                    <div className="input-group">
                        <label>E-mail (Para receber a nota e código de rastreio)</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="input-group">
                        <label>Telefone / WhatsApp</label>
                        <input type="text" name="telefone" required value={formData.telefone} onChange={handleInputChange} />
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label>CEP</label>
                            <input type="text" name="cep" required value={formData.cep} onChange={handleInputChange} />
                        </div>
                        <div className="input-group flex-2">
                            <label>Rua</label>
                            <input type="text" name="rua" required value={formData.rua} onChange={handleInputChange} />
                        </div>
                        <div className="input-group">
                            <label>Número</label>
                            <input type="text" name="numero" required value={formData.numero} onChange={handleInputChange} />
                        </div>
                    </div>

                    <button type="submit" className="btn-finalizar" disabled={isSubmitting || cartItems.length === 0}>
                        {isSubmitting ? 'Processando envio...' : 'Confirmar e Finalizar'}
                    </button>
                </form>

                <aside className="checkout-summary">
                    <h3>Resumo do Pedido</h3>
                    {cartItems.length === 0 ? <p>Carrinho vazio.</p> : (
                        <div className="summary-items">
                            {cartItems.map((item, index) => (
                                <div key={index} className="summary-item">
                                    <span>{item.quantity}x {item.name}</span>
                                    <strong>R$ {(item.price * item.quantity).toFixed(2)}</strong>
                                </div>
                            ))}
                            <div className="summary-total">
                                <span>Total a Pagar</span>
                                <span className="highlight-text">R$ {valorTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}