// ─────────────────────────────────────────────────────────────────
// CartDrawer.jsx — Drawer lateral do carrinho de compras
//
// Painel deslizante exibido à direita da tela quando o usuário
// abre o carrinho. Permite visualizar itens, ajustar quantidades,
// remover produtos e navegar para o checkout.
//
// Props:
//  - isOpen         (boolean): controla se o drawer está visível
//  - onClose        (function): callback para fechar o drawer
//  - cartItems      (array): lista de itens no carrinho
//                   Cada item: { id, name, image, price, quantity }
//  - onUpdateQuantity (function): (productId, newQuantity) => void
//  - onRemoveItem   (function): (productId) => void
//
// Para adicionar um cupom de desconto, insira um campo de texto
// dentro do cart-footer antes do total.
// ─────────────────────────────────────────────────────────────────

import React from 'react';
import { FaTrash } from 'react-icons/fa';
import './CartDrawer.css';
import { useNavigate } from 'react-router-dom';

// Props recebidas do App.jsx
export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }) {
  // useNavigate permite redirecionar para /checkout ao clicar em "Finalizar Compra"
  const navigate = useNavigate();

  // Calcula o valor total somando (preço × quantidade) de cada item
  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    // Overlay escuro: cobre a tela inteira quando aberto
    // Clicar no overlay chama onClose (fecha o drawer)
    <div className={`cart-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      {/* Painel do drawer: stopPropagation impede que cliques internos fechem o drawer */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>

        {/* ── Cabeçalho do drawer ── */}
        <div className="cart-header">
          <h2>Seu Carrinho</h2>
          {/* Botão X para fechar o drawer */}
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {/* ── Corpo com lista de itens ou mensagem de vazio ── */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            // Estado vazio: exibido quando não há itens no carrinho
            <p className="empty-cart">Seu carrinho está vazio.</p>
          ) : (
            // Lista de itens do carrinho
            cartItems.map((item, index) => (
              <div key={index} className="cart-item">
                {/* Imagem do produto em miniatura */}
                <img src={item.image} alt={item.name} />

                <div className="item-details">
                  {/* Nome do produto */}
                  <h4>{item.name}</h4>

                  {/* Preço unitário formatado em Real */}
                  <p className="item-price">
                    {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>

                  <div className="cart-item-actions">
                    {/* Controles de quantidade: diminui / exibe valor / aumenta */}
                    <div className="cart-quantity-controls">
                      {/* Diminui quantidade em 1 (o App impede ir abaixo de 1) */}
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      {/* Aumenta quantidade em 1 */}
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>

                    {/* Botão de remover item completamente do carrinho */}
                    <button className="btn-remove-item" onClick={() => onRemoveItem(item.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Rodapé com total e botão de checkout (só quando há itens) ── */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            {/* Total geral do carrinho formatado em Real */}
            <div className="cart-total">
              <span>Total:</span>
              <span className="highlight-text">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            {/* Botão "Finalizar Compra": fecha o drawer e redireciona para /checkout */}
            <button
              className="btn-gold"
              onClick={() => {
                onClose();
                navigate('/checkout');
              }}
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
