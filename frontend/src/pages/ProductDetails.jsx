import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaTruck, FaClipboardList, FaShieldAlt, FaUndo, FaStar,
  FaChevronLeft, FaBoxOpen, FaHeart,
} from 'react-icons/fa';
import AutoCarousel from '../components/AutoCarousel';
import { useAuth } from '../context/useAuth';
import { toggleFavorite, checkFavorites } from '../services/favoritesApi';
import './ProductDetails.css';

// ─── Skeleton de loading ──────────────────────────────────────────
function SkeletonDetails() {
  return (
    <div className="product-layout pd-skeleton" aria-hidden="true">
      <div className="pd-skeleton-image" />
      <div className="pd-skeleton-info">
        <div className="pd-skeleton-line pd-sk-title" />
        <div className="pd-skeleton-line pd-sk-ref" />
        <div className="pd-skeleton-line pd-sk-price" />
        <div className="pd-skeleton-line pd-sk-text" />
        <div className="pd-skeleton-line pd-sk-text pd-sk-short" />
        <div className="pd-skeleton-actions">
          <div className="pd-skeleton-btn" />
          <div className="pd-skeleton-btn" />
        </div>
      </div>
    </div>
  );
}

// ─── ProductDetailsContent ────────────────────────────────────────
function ProductDetailsContent({ productId, onAddToCart, products = [] }) {
  const [quantity, setQuantity]     = useState(1);
  const [activeImg, setActiveImg]   = useState(0);
  const [favorited, setFavorited]   = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const product = products?.find((p) => String(p.id) === String(productId));
  const relatedProducts = products?.filter(
    (p) => p.category === product?.category && p.id !== product?.id
  ) || [];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !product) return;
    checkFavorites([product.id])
      .then((map) => setFavorited(Boolean(map[product.id])))
      .catch(() => {});
  }, [isAuthenticated, product?.id]);

  const handleComprarAgora = () => {
    onAddToCart(product, quantity);
    navigate('/checkout');
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || favLoading) return;
    setFavLoading(true);
    try {
      const res = await toggleFavorite(product.id);
      setFavorited(res.favorited);
    } catch {
      // silently fail
    } finally {
      setFavLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="container details-page">
        <div className="pd-not-found">
          <div className="pd-not-found-icon"><FaBoxOpen /></div>
          <h2>Produto não encontrado</h2>
          <p>Este produto pode ter sido removido ou o link está incorreto.</p>
          <Link to="/catalogo" className="pd-not-found-btn">Ver catálogo</Link>
        </div>
      </div>
    );
  }

  const allImages = product.images?.length > 0
    ? product.images
    : (product.image ? [product.image] : []);

  const isPromo = Boolean(product.isPromo);
  const displayPrice = isPromo ? product.promotionalPrice : product.price;
  const formattedPrice = Number(displayPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedOriginalPrice = isPromo
    ? Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;
  const discountPct = isPromo && product.price > 0
    ? Math.round((1 - product.promotionalPrice / product.price) * 100)
    : 0;

  return (
    <main className="container details-page">

      {/* ── Breadcrumb / voltar ── */}
      <nav className="pd-breadcrumb" aria-label="Navegação">
        <button type="button" className="pd-back-btn" onClick={() => navigate(-1)}>
          <FaChevronLeft aria-hidden /> Voltar
        </button>
        <span className="pd-breadcrumb-sep" aria-hidden>›</span>
        <Link to="/catalogo" className="pd-breadcrumb-link">Catálogo</Link>
        <span className="pd-breadcrumb-sep" aria-hidden>›</span>
        <span className="pd-breadcrumb-current">{product.name}</span>
      </nav>

      {/* ── Layout principal ── */}
      <div className="product-layout">

        {/* ── Galeria de imagens ── */}
        <div className="product-image-container">
          {isPromo && (
            <span className="pd-promo-badge">-{discountPct}% OFF</span>
          )}
          <img
            src={allImages[activeImg] || product.image}
            alt={product.name}
            className="product-main-image"
            key={activeImg}
          />
          {allImages.length > 1 && (
            <div className="pd-thumbnails">
              {allImages.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pd-thumb${i === activeImg ? ' pd-thumb--active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Imagem ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Informações ── */}
        <div className="product-info-container">
          <div className="pd-title-row">
            <h1 className="details-title">{product.name}</h1>
            {isAuthenticated && (
              <button
                type="button"
                className={`pd-fav-btn${favorited ? ' pd-fav-btn--active' : ''}`}
                onClick={handleToggleFavorite}
                disabled={favLoading}
                aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <FaHeart aria-hidden />
                <span>{favorited ? 'Favoritado' : 'Favoritar'}</span>
              </button>
            )}
          </div>

          <p className="details-ref">
            Código / ref.: <span className="highlight-text">{product.ref}</span>
          </p>
          <hr className="divider" />

          {/* ── Preço ── */}
          <div className="price-box">
            {formattedOriginalPrice && (
              <p className="details-original-price">{formattedOriginalPrice}</p>
            )}
            <p className={`details-price${isPromo ? ' details-price--promo' : ''}`}>
              {formattedPrice}
            </p>
            {isPromo && (
              <p className="details-promo-tag">
                Economia de {formattedOriginalPrice} → {formattedPrice} ({discountPct}% de desconto)
              </p>
            )}
            <p className="details-pix">
              {isPromo ? 'Preço promocional — oferta por tempo limitado.' : 'À vista no boleto ou PIX com condição promocional.'}
            </p>
            <p className="details-installments">Parcelamento conforme política da loja</p>
          </div>

          {/* ── Frete ── */}
          <div className="shipping-calc">
            <p className="shipping-calc-title">
              <FaTruck aria-hidden />
              Simule frete e prazo
            </p>
            <div className="cep-input">
              <input type="text" placeholder="Digite seu CEP" aria-label="CEP para cálculo de frete" maxLength={9} />
              <button type="button">Calcular</button>
            </div>
          </div>

          {/* ── Quantidade ── */}
          <div className="quantity-selector-container">
            <span className="quantity-label">Quantidade</span>
            <div className="quantity-controls">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-display">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
          </div>

          {/* ── Botões de ação ── */}
          <div className="action-buttons">
            <button type="button" className="btn-gold btn-large" onClick={handleComprarAgora}>
              Comprar agora
            </button>
            <button
              type="button"
              className="btn-outline btn-large"
              onClick={() => onAddToCart(product, quantity)}
            >
              Adicionar ao carrinho
            </button>
          </div>

          {/* ── Selos de confiança ── */}
          <div className="pd-trust-badges">
            <div className="pd-trust-badge">
              <FaShieldAlt aria-hidden />
              <span>Compra segura</span>
            </div>
            <div className="pd-trust-badge">
              <FaUndo aria-hidden />
              <span>Trocas e devoluções</span>
            </div>
            <div className="pd-trust-badge">
              <FaStar aria-hidden />
              <span>Qualidade garantida</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Descrição ── */}
      <div className="product-description-box">
        <h3 className="description-heading">
          <FaClipboardList aria-hidden />
          Descrição do produto
        </h3>
        <p>Informações do produto — personalize este texto com os detalhes reais do item.</p>
        <p><strong>Garantia:</strong> Conforme política comercial da sua loja.</p>
        <p>Dúvidas? Entre em contato pelos nossos canais de atendimento.</p>
      </div>

      {/* ── Relacionados ── */}
      {relatedProducts.length > 0 && (
        <section className="related-section">
          <div className="section-header">
            <div className="section-header-left">
              <div>
                <h2>Produtos relacionados</h2>
                <p className="section-subtitle">Outros itens da mesma categoria</p>
              </div>
            </div>
          </div>
          <AutoCarousel products={relatedProducts} onAddToCart={onAddToCart} />
        </section>
      )}
    </main>
  );
}

// ─── ProductDetails (exportado) ───────────────────────────────────
export default function ProductDetails({ onAddToCart, products = [], isLoadingProducts }) {
  const { id } = useParams();

  if (isLoadingProducts) {
    return (
      <div className="container details-page">
        <SkeletonDetails />
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
