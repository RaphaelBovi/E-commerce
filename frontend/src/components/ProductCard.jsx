import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../context/useAuth';
import { useFavorites } from '../context/FavoritesProvider';
import './ProductCard.css';

export default function ProductCard({
  product,
  onAddToCart,
  layout = 'grid',
}) {
  const { isAuthenticated } = useAuth();
  const { isFavorited, toggleFav } = useFavorites();

  const allImages = product.images?.length > 0
    ? product.images
    : (product.image ? [product.image] : []);

  const [imgIdx, setImgIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const favorited = isAuthenticated && isFavorited(product.id);

  // Auto-cycle images every 2.5 seconds
  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setImgIdx((i) => (i + 1) % allImages.length);
        setFading(false);
      }, 200);
    }, 2500);
    return () => clearInterval(interval);
  }, [allImages.length]);

  useEffect(() => { setImgIdx(0); }, [product.id]);

  const currentImage = allImages[imgIdx] || '';

  const isOutOfStock = product.qnt === 0;
  const isPromo    = Boolean(product.isPromo);
  const showPrice  = isPromo ? product.promotionalPrice : product.price;
  const formattedPrice = Number(showPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedOldPrice = isPromo
    ? Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;
  const installmentPrice = (Number(showPrice || 0) / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const discountPct = isPromo && product.price > 0
    ? Math.round((1 - product.promotionalPrice / product.price) * 100)
    : 0;

  const layoutClass = layout === 'list' ? 'product-card--layout-list' : '';

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || favLoading) return;
    setFavLoading(true);
    try {
      await toggleFav(product.id);
    } catch {
      // silently fail
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className={`product-card ${layoutClass}`.trim()}>

      {isOutOfStock ? (
        <span className="product-badge product-badge--esgotado">Esgotado</span>
      ) : isPromo ? (
        <span className="product-badge product-badge--promo">-{discountPct}% OFF</span>
      ) : null}

      {isAuthenticated && (
        <button
          type="button"
          className={`pc-fav-btn${favorited ? ' pc-fav-btn--active' : ''}`}
          onClick={handleToggleFavorite}
          disabled={favLoading}
          aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <FaHeart />
        </button>
      )}

      <Link to={`/produto/${product.id}`} className="product-link">
        <div className="image-container">
          {currentImage ? (
            <img
              key={imgIdx}
              src={currentImage}
              alt={product.name}
              className={`product-image${fading ? ' product-image--fading' : ''}`}
            />
          ) : (
            <div className="product-image-placeholder" aria-hidden />
          )}

          {allImages.length > 1 && (
            <div className="product-img-dots" aria-hidden>
              {allImages.map((_, i) => (
                <span
                  key={i}
                  className={`product-img-dot${i === imgIdx ? ' product-img-dot--active' : ''}`}
                />
              ))}
            </div>
          )}

          {layout !== 'list' && (
            <div className="product-card-overlay">
              <button
                type="button"
                className="btn-quick-add"
                onClick={(e) => { e.preventDefault(); if (!isOutOfStock) onAddToCart(product); }}
                disabled={isOutOfStock}
                aria-label={isOutOfStock ? 'Produto esgotado' : `Adicionar ${product.name} ao carrinho`}
              >
                {isOutOfStock ? 'Esgotado' : '+ Adicionar ao Carrinho'}
              </button>
            </div>
          )}
        </div>
      </Link>

      <div className="product-info">
        <Link to={`/produto/${product.id}`} className="product-link">
          <p className="product-ref">{product.ref}: {product.name}</p>
        </Link>

        <p className="payment-method">
          {isPromo ? 'Oferta especial' : 'À vista com desconto'}
        </p>

        {formattedOldPrice && (
          <p className="product-old-price">{formattedOldPrice}</p>
        )}

        <p className={`product-price${isPromo ? ' product-price--promo' : ''}`}>
          {formattedPrice}
        </p>

        <p className="product-installments">
          Em até 6x de {installmentPrice} sem juros
        </p>

        <button
          className="btn-gold"
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Esgotado' : 'Adicionar ao Carrinho'}
        </button>
      </div>
    </div>
  );
}
