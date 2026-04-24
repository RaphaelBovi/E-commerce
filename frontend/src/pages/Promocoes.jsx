import { useState, useEffect } from 'react';
import { FaTag, FaBoxOpen, FaFire, FaSortAmountDown } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/productsApi';
import './Promocoes.css';

export default function Promocoes({ onAddToCart }) {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [sortBy, setSortBy]       = useState('discount'); // 'discount' | 'price-asc' | 'price-desc'

  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data.filter((p) => p.isPromo)))
      .catch((e)  => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'price-asc')  return a.promotionalPrice - b.promotionalPrice;
    if (sortBy === 'price-desc') return b.promotionalPrice - a.promotionalPrice;
    // 'discount': highest percentage discount first
    const discA = 1 - a.promotionalPrice / a.price;
    const discB = 1 - b.promotionalPrice / b.price;
    return discB - discA;
  });

  return (
    <main className="promo-page">
      <div className="container">

        {/* ── Hero ── */}
        <section className="promo-hero">
          <div className="promo-hero-kicker">
            <FaFire aria-hidden /> Promoções ativas
          </div>
          <h1 className="promo-hero-title">
            Ofertas <span className="promo-hero-accent">imperdíveis</span>
          </h1>
          <p className="promo-hero-sub">
            Produtos selecionados com desconto real — preço promocional definido pelo nosso time.
          </p>
        </section>

        {/* ── Toolbar ── */}
        {!loading && products.length > 0 && (
          <div className="promo-toolbar">
            <p className="promo-count">
              <FaTag aria-hidden />
              {products.length} {products.length === 1 ? 'produto em promoção' : 'produtos em promoção'}
            </p>
            <div className="promo-sort">
              <FaSortAmountDown aria-hidden />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="discount">Maior desconto</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="promo-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="promo-skeleton" aria-hidden />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="promo-error">
            <p>Não foi possível carregar as promoções. Tente novamente.</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && products.length === 0 && (
          <div className="promo-empty">
            <FaBoxOpen className="promo-empty-icon" aria-hidden />
            <h2>Nenhuma promoção ativa no momento</h2>
            <p>Volte em breve — novas ofertas são adicionadas regularmente.</p>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && !error && sorted.length > 0 && (
          <div className="promo-grid responsive-grid">
            {sorted.map((product) => (
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
