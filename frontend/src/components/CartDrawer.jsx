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

import React, { useState } from 'react';
import { FaTrash, FaShare, FaCheck, FaSpinner } from 'react-icons/fa';
import './CartDrawer.css';
import { useNavigate } from 'react-router-dom';
import { shareCart } from '../services/cartShareApi';
import { useAuth } from '../context/useAuth';

// Props recebidas do App.jsx
export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [shareState, setShareState] = useState('idle'); // idle | loading | copied

  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleShare = async () => {
    if (shareState === 'loading') return;
    setShareState('loading');
    try {
      const { token } = await shareCart(cartItems);
      const url = `${window.location.origin}/carrinho/${token}`;
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 3000);
    } catch {
      setShareState('idle');
      alert('Não foi possível gerar o link. Tente novamente.');
    }
  };

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
            cartItems.map((item) => {
              const itemKey = item._key || String(item.id);
              const maxQty  = item.variantQnt != null ? item.variantQnt : item.qnt;
              return (
                <div key={itemKey} className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    {item.variantName && (
                      <p className="item-variant">{item.variantName}</p>
                    )}
                    <p className="item-price">
                      {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <div className="cart-item-actions">
                      <div className="cart-quantity-controls">
                        <button onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
                          disabled={maxQty != null && item.quantity >= maxQty}
                          title={maxQty != null && item.quantity >= maxQty ? 'Estoque máximo atingido' : undefined}
                        >+</button>
                      </div>
                      <button className="btn-remove-item" onClick={() => onRemoveItem(itemKey)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
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

            {isAuthenticated && (
              <button
                className="cart-share-btn"
                onClick={handleShare}
                disabled={shareState === 'loading'}
                title="Copiar link do carrinho"
              >
                {shareState === 'loading' ? (
                  <><FaSpinner className="cart-share-spin" /> Gerando link...</>
                ) : shareState === 'copied' ? (
                  <><FaCheck /> Link copiado!</>
                ) : (
                  <><FaShare /> Compartilhar carrinho</>
                )}
              </button>
            )}

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
