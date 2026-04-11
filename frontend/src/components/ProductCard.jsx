import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({
  product,
  onAddToCart,
  variant = 'default',
  badgeText = '',
  oldPrice = null,
}) {
  const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const installmentPrice = (product.price / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedOldPrice = oldPrice
    ? oldPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  return (
    <div className={`product-card ${variant !== 'default' ? `product-card-${variant}` : ''}`}>
      {badgeText ? <span className="product-badge">{badgeText}</span> : null}
      <Link to={`/produto/${product.id}`} className="product-link">
        <div className="image-container">
          <img src={product.image} alt={product.name} className="product-image" />
        </div>
      </Link>
      
      <div className="product-info">
        <Link to={`/produto/${product.id}`} className="product-link">
          <p className="product-ref">{product.ref}: {product.name}</p>
        </Link>
        <p className="payment-method">À vista no PIX</p>
        {formattedOldPrice ? <p className="product-old-price">{formattedOldPrice}</p> : null}
        <p className="product-price">{formattedPrice}</p>
        <p className="product-installments">Em até 6x de {installmentPrice} sem juros</p>
        <button className="btn-gold" onClick={() => onAddToCart(product)}>
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
}