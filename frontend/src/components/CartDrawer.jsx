import React from 'react';
import { FaTrash } from 'react-icons/fa';
import './CartDrawer.css';
import { useNavigate } from 'react-router-dom';


export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }) {
  const navigate = useNavigate();
  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className={`cart-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Seu Carrinho</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <p className="empty-cart">Seu carrinho está vazio.</p>
          ) : (
            cartItems.map((item, index) => (
              <div key={index} className="cart-item">
                <img src={item.image} alt={item.name} />

                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p className="highlight-text">
                    {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <div className="cart-item-actions">
                    <div className="cart-quantity-controls">
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="btn-remove-item" onClick={() => onRemoveItem(item.id)}>
                      <FaTrash />
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span className="highlight-text">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
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