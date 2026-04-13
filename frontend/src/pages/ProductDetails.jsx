import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTruck, FaClipboardList } from 'react-icons/fa';
import AutoCarousel from '../components/AutoCarousel';
import './ProductDetails.css';

function ProductDetailsContent({ productId, onAddToCart, products = [] }) {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  const product = products?.find((p) => String(p.id) === String(productId));
  const relatedProducts =
    products?.filter((p) => p.category === product?.category && p.id !== product?.id) || [];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleComprarAgora = () => {
    onAddToCart(product, quantity);
    navigate('/checkout');
  };

  if (!product) {
    return (
      <div className="container details-loading">
        Produto não encontrado.
      </div>
    );
  }

  const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const brandLabel = product.name.split('-')[1]?.trim() || 'Padrão';

  return (
    <main className="container details-page">
      <div className="product-layout">

        <div className="product-image-container">
          <img src={product.image} alt="" className="product-main-image" />
        </div>

        <div className="product-info-container">
          <h1 className="details-title">{product.name}</h1>
          <p className="details-ref">
            Código / ref.: <span className="highlight-text">{product.ref}</span>
          </p>
          <hr className="divider" />

          <div className="price-box">
            <p className="details-price">{formattedPrice}</p>
            <p className="details-pix">À vista no boleto ou PIX com condição promocional (configure no seu projeto).</p>
            <p className="details-installments">Parcelamento conforme política da loja</p>
          </div>

          <div className="shipping-calc">
            <p className="shipping-calc-title">
              <FaTruck size={18} color="var(--primary)" aria-hidden />
              Simule frete e prazo
            </p>
            <div className="cep-input">
              <input type="text" placeholder="CEP" aria-label="CEP para cálculo de frete" />
              <button type="button">Calcular</button>
            </div>
          </div>

          <div className="quantity-selector-container">
            <span className="quantity-label">Quantidade</span>
            <div className="quantity-controls">
              <button type="button" onClick={decreaseQuantity} aria-label="Diminuir">−</button>
              <span className="quantity-display">{quantity}</span>
              <button type="button" onClick={increaseQuantity} aria-label="Aumentar">+</button>
            </div>
          </div>

          <div className="action-buttons">
            <button type="button" className="btn-gold btn-large" onClick={handleComprarAgora}>
              Comprar agora
            </button>
            <button type="button" className="btn-outline btn-large" onClick={() => onAddToCart(product, quantity)}>
              Adicionar ao carrinho
            </button>
          </div>

        </div>
      </div>

      <div className="product-description-box">
        <h3 className="description-heading">
          <FaClipboardList aria-hidden />
          Descrição
        </h3>
        <p><strong>Aplicação:</strong> Compatibilidade conforme ficha técnica do fabricante (ajuste este texto no template).</p>
        <p><strong>Marca / linha:</strong> {brandLabel}</p>
        <p><strong>Garantia:</strong> Conforme política comercial da sua loja.</p>
        <p>Dúvidas? Inclua aqui canais de atendimento (chat, e-mail ou mensagens).</p>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="related-section">
          <h2>Relacionados</h2>
          <p className="section-subtitle related-subtitle">Outros itens na mesma categoria</p>
          <AutoCarousel products={relatedProducts} onAddToCart={onAddToCart} />
        </section>
      ) : null}
    </main>
  );
}

export default function ProductDetails({ onAddToCart, products = [], isLoadingProducts }) {
  const { id } = useParams();

  if (isLoadingProducts) {
    return (
      <div className="container details-loading">
        Carregando produto…
      </div>
    );
  }

  return (
    <ProductDetailsContent
      key={id}
      productId={id}
      onAddToCart={onAddToCart}
      products={products}
    />
  );
}
