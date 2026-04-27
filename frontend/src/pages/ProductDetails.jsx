import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaTruck, FaClipboardList, FaShieldAlt, FaUndo, FaStar,
  FaChevronLeft, FaBoxOpen, FaHeart,
} from 'react-icons/fa';
import AutoCarousel from '../components/AutoCarousel';
import { useAuth } from '../context/useAuth';
import { toggleFavorite, checkFavorites } from '../services/favoritesApi';
import { getProductReviews, canReviewProduct, submitReview } from '../services/reviewsApi';
import { useSEO } from '../hooks/useSEO';
import { addRecentlyViewed, getRecentlyViewed } from '../hooks/useRecentlyViewed';
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
function StarRating({ value, onChange, size = '1.2rem' }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.15rem' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0 }}
          aria-label={`${s} estrela${s > 1 ? 's' : ''}`}
        >
          <FaStar style={{
            fontSize: size,
            color: s <= (hover || value) ? 'var(--accent)' : 'var(--border-strong)',
            transition: 'color var(--transition-fast)',
          }} />
        </button>
      ))}
    </div>
  );
}

function RecentlyViewedSection({ products, currentId, onAddToCart }) {
  const recent = getRecentlyViewed(products).filter(p => String(p.id) !== String(currentId)).slice(0, 6);
  if (recent.length === 0) return null;
  return (
    <section className="related-section">
      <div className="section-header">
        <div className="section-header-left">
          <div>
            <h2>Você também viu</h2>
            <p className="section-subtitle">Produtos que você visitou recentemente</p>
          </div>
        </div>
      </div>
      <AutoCarousel products={recent} onAddToCart={onAddToCart} />
    </section>
  );
}

function ProductDetailsContent({ productId, onAddToCart, products = [] }) {
  const [quantity, setQuantity]     = useState(1);
  const [activeImg, setActiveImg]   = useState(0);
  const [favorited, setFavorited]   = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Reviews state
  const [reviews, setReviews]         = useState(null);
  const [canReview, setCanReview]     = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const product = products?.find((p) => String(p.id) === String(productId));
  useSEO({
    title: product?.name,
    description: product ? `${product.name} — ${product.marca}. Compre com segurança e entrega rápida.` : undefined,
    image: product?.images?.[0] || product?.image || undefined,
    url: product ? `${window.location.origin}/produto/${product.id}` : undefined,
  });
  const relatedProducts = products?.filter(
    (p) => p.category === product?.category && p.id !== product?.id
  ) || [];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product) addRecentlyViewed(product.id);
  }, []);

  // JSON-LD structured data (Schema.org Product)
  useEffect(() => {
    if (!product) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id   = 'product-jsonld';
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.images?.[0] || product.image,
      description: `${product.name} — ${product.marca}`,
      sku: product.ref,
      brand: { '@type': 'Brand', name: product.marca },
      offers: {
        '@type': 'Offer',
        price: product.isPromo ? product.promotionalPrice : product.price,
        priceCurrency: 'BRL',
        availability: product.qnt > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
      ...(product.reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.averageRating,
          reviewCount: product.reviewCount,
        },
      }),
    };
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => document.getElementById('product-jsonld')?.remove();
  }, [product?.id]);

  useEffect(() => {
    if (!isAuthenticated || !product) return;
    checkFavorites([product.id])
      .then((map) => setFavorited(Boolean(map[product.id])))
      .catch(() => {});
  }, [isAuthenticated, product?.id]);

  const isOutOfStock = product.qnt === 0;
  const isLowStock   = product.qnt > 0 && product.qnt <= 3;

  // Clamp quantity when stock decreases below current selection
  useEffect(() => {
    if (product.qnt > 0 && quantity > product.qnt) setQuantity(product.qnt);
  }, [product.qnt]);

  const handleComprarAgora = () => {
    if (isOutOfStock) return;
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

  // Load reviews for this product
  useEffect(() => {
    if (!product?.id) return;
    getProductReviews(product.id).then(setReviews).catch(() => {});
  }, [product?.id]);

  // Check if user can review (has DELIVERED order with this product)
  useEffect(() => {
    if (!isAuthenticated || !product?.id) return;
    canReviewProduct(product.id).then((r) => setCanReview(r.canReview)).catch(() => {});
  }, [isAuthenticated, product?.id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewRating) { setReviewError('Selecione uma nota.'); return; }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await submitReview(product.id, { rating: reviewRating, comment: reviewComment });
      const updated = await getProductReviews(product.id);
      setReviews(updated);
      setCanReview(false);
      setReviewRating(0);
      setReviewComment('');
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
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
            fetchpriority="high"
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
                  <img src={src} alt="" loading="lazy" />
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

          {/* ── Indicadores de estoque ── */}
          {isOutOfStock && (
            <p className="pd-out-of-stock">Produto esgotado — indisponível no momento</p>
          )}
          {isLowStock && (
            <p className="pd-low-stock">Restam apenas {product.qnt} {product.qnt === 1 ? 'unidade' : 'unidades'}!</p>
          )}

          {/* ── Quantidade ── */}
          <div className="quantity-selector-container">
            <span className="quantity-label">Quantidade</span>
            <div className="quantity-controls">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1 || isOutOfStock}
              >
                −
              </button>
              <span className="quantity-display">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.qnt, q + 1))}
                aria-label="Aumentar quantidade"
                disabled={isOutOfStock || quantity >= product.qnt}
              >
                +
              </button>
            </div>
          </div>

          {/* ── Botões de ação ── */}
          <div className="action-buttons">
            <button
              type="button"
              className="btn-gold btn-large"
              onClick={handleComprarAgora}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Produto esgotado' : 'Comprar agora'}
            </button>
            <button
              type="button"
              className="btn-outline btn-large"
              onClick={() => !isOutOfStock && onAddToCart(product, quantity)}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Indisponível' : 'Adicionar ao carrinho'}
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

      {/* ── Avaliações ── */}
      <section className="pd-reviews-section">
        <div className="pd-reviews-header">
          <h3 className="description-heading"><FaStar aria-hidden /> Avaliações dos clientes</h3>
          {reviews && reviews.totalCount > 0 && (
            <div className="pd-reviews-summary">
              <span className="pd-reviews-avg">{Number(reviews.averageRating).toFixed(1)}</span>
              <StarRating value={Math.round(reviews.averageRating)} size="1rem" />
              <span className="pd-reviews-count">({reviews.totalCount} {reviews.totalCount === 1 ? 'avaliação' : 'avaliações'})</span>
            </div>
          )}
        </div>

        {/* Distribution bars */}
        {reviews && reviews.totalCount > 0 && (
          <div className="pd-reviews-distribution">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.distribution[star] || 0;
              const pct = reviews.totalCount > 0 ? Math.round((count / reviews.totalCount) * 100) : 0;
              return (
                <div key={star} className="pd-dist-row">
                  <span className="pd-dist-star">{star} <FaStar style={{ fontSize: '0.75rem', color: 'var(--accent)' }} /></span>
                  <div className="pd-dist-bar"><div className="pd-dist-fill" style={{ width: `${pct}%` }} /></div>
                  <span className="pd-dist-count">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Review form */}
        {isAuthenticated && canReview && (
          <form className="pd-review-form" onSubmit={handleReviewSubmit}>
            <h4>Deixe sua avaliação</h4>
            <StarRating value={reviewRating} onChange={setReviewRating} size="1.5rem" />
            <textarea
              className="pd-review-textarea"
              placeholder="Conte o que achou do produto (opcional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            {reviewError && <p className="pd-review-error">{reviewError}</p>}
            <button type="submit" className="pd-review-submit" disabled={reviewSubmitting}>
              {reviewSubmitting ? 'Enviando…' : 'Enviar avaliação'}
            </button>
          </form>
        )}

        {/* Review list */}
        {reviews && reviews.reviews.length > 0 ? (
          <ul className="pd-review-list">
            {reviews.reviews.map((r) => (
              <li key={r.id} className="pd-review-item">
                <div className="pd-review-top">
                  <div className="pd-review-author">
                    <div className="pd-review-avatar">{(r.userFullName || r.userEmail || '?').slice(0, 1).toUpperCase()}</div>
                    <div>
                      <strong>{r.userFullName || r.userEmail}</strong>
                      <time className="pd-review-date">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</time>
                    </div>
                  </div>
                  <StarRating value={r.rating} size="0.9rem" />
                </div>
                {r.comment && <p className="pd-review-comment">{r.comment}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pd-reviews-empty">
            {reviews ? 'Nenhuma avaliação ainda. Seja o primeiro a avaliar!' : 'Carregando avaliações…'}
          </p>
        )}
      </section>

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

      {/* ── Vistos recentemente ── */}
      <RecentlyViewedSection products={products} currentId={productId} onAddToCart={onAddToCart} />
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
