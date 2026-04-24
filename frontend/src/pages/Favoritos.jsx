import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaBoxOpen, FaChevronLeft } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import { fetchFavorites } from '../services/favoritesApi';
import './Favoritos.css';

export default function Favoritos({ onAddToCart }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetchFavorites()
      .then(setFavorites)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = (productId) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <main className="fav-page">
      <div className="container">

        {/* ── Header ── */}
        <div className="fav-header">
          <Link to="/minha-conta" className="fav-back-link">
            <FaChevronLeft aria-hidden /> Minha Conta
          </Link>
          <div className="fav-title-row">
            <span className="fav-icon-wrap"><FaHeart aria-hidden /></span>
            <div>
              <h1 className="fav-title">Meus Favoritos</h1>
              {!loading && !error && (
                <p className="fav-subtitle">
                  {favorites.length === 0
                    ? 'Nenhum produto salvo ainda'
                    : `${favorites.length} ${favorites.length === 1 ? 'produto salvo' : 'produtos salvos'}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="fav-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="fav-skeleton" aria-hidden />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="fav-error">
            Não foi possível carregar seus favoritos. Tente novamente.
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && favorites.length === 0 && (
          <div className="fav-empty">
            <FaBoxOpen className="fav-empty-icon" aria-hidden />
            <h2>Sua lista de favoritos está vazia</h2>
            <p>Explore nosso catálogo e clique no coração para salvar produtos que você gosta.</p>
            <Link to="/catalogo" className="fav-empty-btn">Ver catálogo</Link>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && !error && favorites.length > 0 && (
          <div className="fav-grid responsive-grid">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
