import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTruck, FaClipboardList } from 'react-icons/fa';
import AutoCarousel from '../components/AutoCarousel';
import './ProductDetails.css';

export default function ProductDetails({ onAddToCart, products = [], isLoadingProducts }) {
  const { id } = useParams();
  
  const product = products?.find((p) => String(p.id) === String(id));
  const relatedProducts = products?.filter(p => p.category === product?.category && p.id !== product?.id) || [];
  
  const [quantity, setQuantity] = useState(1);
  const [lastId, setLastId] = useState(id);
  const navigate = useNavigate();
  
  if (id !== lastId) {
    setLastId(id);
    setQuantity(1);
  }

  const handleComprarAgora = () => {
    onAddToCart(product, quantity);
    navigate('/checkout');
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (isLoadingProducts) {
    return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Carregando produto...</div>;
  }

  if (!product) {
    return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Produto não encontrado.</div>;
  }

  const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  return (
    <main className="container details-page">
      <div className="product-layout">

        <div className="product-image-container">
          <img src={product.image} alt={product.name} className="product-main-image" />
        </div>

        <div className="product-info-container">
          <h1 className="details-title">{product.name}</h1>
          <p className="details-ref">Código / Ref: <span className="highlight-text">{product.ref}</span></p>
          <hr className="divider" />

          <div className="price-box">
            <p className="details-price">{formattedPrice}</p>
            <p className="details-pix">À vista no Boleto ou Pix com <strong>5% OFF</strong></p>
            <p className="details-installments">Ou em até 6x s/ juros</p>
          </div>

          <div className="shipping-calc">
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <FaTruck size={20} color="var(--text-yellow)" /> Calcule o frete e prazo
            </p>
            <div className="cep-input">
              <input type="text" placeholder="Digite seu CEP" />
              <button>Calcular</button>
            </div>
          </div>

          <div className="quantity-selector-container">
            <span className="quantity-label">Quantidade:</span>
            <div className="quantity-controls">
              <button onClick={decreaseQuantity}>-</button>
              <span className="quantity-display">{quantity}</span>
              <button onClick={increaseQuantity}>+</button>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-gold btn-large" onClick={handleComprarAgora}>
              Comprar Agora
            </button>
            <button className="btn-outline btn-large" onClick={() => onAddToCart(product, quantity)}>
              Adicionar ao Carrinho
            </button>
          </div>

        </div>
      </div>

      <div className="product-description-box">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaClipboardList /> Descrição Técnica
        </h3>
        <p><strong>Aplicação:</strong> Compatível com a linha industrial e maquinário pesado.</p>
        <p><strong>Marca:</strong> {product.name.split('-')[1] || 'Genuína'}</p>
        <p><strong>Garantia:</strong> 90 dias contra defeitos de fabricação.</p>
        <p>Ficou com dúvidas? Estamos à disposição para ajudar através do nosso WhatsApp de vendas.</p>
      </div>

      {relatedProducts.length > 0 && (
        <section className="related-section">
          <h2>Produtos <span className="highlight-text">Relacionados</span></h2>
          <p className="section-subtitle" style={{ marginBottom: '2rem' }}>Confira outras peças desta categoria</p>
          <AutoCarousel products={relatedProducts} onAddToCart={onAddToCart} />
        </section>
      )}
    </main>
  );
}