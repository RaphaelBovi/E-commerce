import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaShippingFast, FaStar, FaCreditCard, FaTag, FaArrowRight } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import AutoCarousel from '../components/AutoCarousel';
import './Home.css';

function sortByNewest(list) {
  return [...list].sort((a, b) => {
    if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

function SkeletonCard() {
  return <div className="home-skeleton-card" aria-hidden="true" />;
}

export default function Home({ onAddToCart, products, isLoadingProducts, productsError }) {
  const heroProduct   = products[0];
  const maisVendidos  = products.filter(p => p.category === 'mais-vendidos').slice(0, 10);
  const novidades     = sortByNewest(products).slice(0, 15);
  const gerais        = products.filter(p => p.category === 'geral').slice(0, 10);

  return (
    <main className="home-main">
      <div className="container home-container">

        {/* ── Banner de erro ── */}
        {productsError && (
          <p className="home-banner home-banner--warn" role="alert">{productsError}</p>
        )}

        {/* ── Hero ── */}
        <section className="home-hero">
          <div className="hero-content">
            <span className="hero-kicker">Bem-vindo à loja</span>
            <h1>Produtos com qualidade<br />e preço justo</h1>
            <p className="hero-description">
              Navegue pelo catálogo, compare opções e monte seu pedido com poucos cliques.
              Entrega rápida para todo o Brasil.
            </p>
            <div className="hero-actions">
              <Link to="/catalogo" className="hero-cta-primary">
                Ver catálogo completo
              </Link>
              <Link to="/promocoes" className="hero-link-secondary">
                Ver ofertas
              </Link>
            </div>
          </div>

          {heroProduct && (
            <div className="hero-highlight-card">
              <span className="hero-highlight-tag">Destaque</span>
              <img src={heroProduct.image} alt={heroProduct.name} className="hero-highlight-image" />
              <h3>{heroProduct.name}</h3>
              <p className="hero-highlight-ref">Ref. {heroProduct.ref}</p>
              <p className="hero-highlight-price">
                {heroProduct.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <button type="button" className="btn-gold" onClick={() => onAddToCart(heroProduct)}>
                Adicionar ao carrinho
              </button>
            </div>
          )}
        </section>

        {/* ── Trust bar ── */}
        <div className="home-trust-bar">
          <div className="trust-item">
            <div className="trust-icon"><FaShippingFast /></div>
            <div className="trust-text">
              <strong>Frete grátis</strong>
              <span>Acima de R$ 299</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon"><FaCreditCard /></div>
            <div className="trust-text">
              <strong>6x sem juros</strong>
              <span>No cartão de crédito</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon"><FaShieldAlt /></div>
            <div className="trust-text">
              <strong>Compra segura</strong>
              <span>Dados criptografados</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon"><FaStar /></div>
            <div className="trust-text">
              <strong>Garantia</strong>
              <span>Em todos os produtos</span>
            </div>
          </div>
        </div>

        {/* ── Mais vendidos ── */}
        <section className="product-section">
          <div className="section-header">
            <div className="section-header-left">
              <div>
                <h2>Mais vendidos</h2>
                <p className="section-subtitle">Produtos favoritos dos nossos clientes</p>
              </div>
            </div>
            <Link to="/catalogo" className="section-view-all">Ver todos →</Link>
          </div>

          {isLoadingProducts ? (
            <div className="home-product-grid">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="home-product-grid">
              {maisVendidos.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
              ))}
            </div>
          )}
        </section>

        {/* ── Banner promocional ── */}
        <div className="home-promo-banner">
          <div className="home-promo-banner-icon"><FaTag /></div>
          <div className="home-promo-banner-text">
            <strong>Ofertas imperdíveis</strong>
            <span>Aproveite descontos exclusivos por tempo limitado</span>
          </div>
          <Link to="/promocoes" className="home-promo-banner-cta">
            Ver ofertas <FaArrowRight />
          </Link>
        </div>

        {/* ── Novidades ── */}
        <section className="product-section">
          <div className="section-header">
            <div className="section-header-left">
              <div>
                <h2>Novidades</h2>
                <p className="section-subtitle">Os lançamentos mais recentes do catálogo</p>
              </div>
            </div>
            <Link to="/lancamentos" className="section-view-all">Ver todos →</Link>
          </div>

          {isLoadingProducts ? (
            <div className="home-product-grid">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <AutoCarousel products={novidades} onAddToCart={onAddToCart} />
          )}
        </section>

        {/* ── Explore o catálogo ── */}
        {(isLoadingProducts || gerais.length > 0) && (
          <section className="product-section product-section-alt">
            <div className="section-header">
              <div className="section-header-left">
                <div>
                  <h2>Explore o catálogo</h2>
                  <p className="section-subtitle">Seleção geral de produtos</p>
                </div>
              </div>
              <Link to="/catalogo" className="section-view-all">Ver todos →</Link>
            </div>

            {isLoadingProducts ? (
              <div className="home-product-grid">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="home-product-grid">
                {gerais.map(product => (
                  <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                ))}
              </div>
            )}

            <div className="view-all-container">
              <Link to="/catalogo" className="btn-view-all">Ver catálogo completo</Link>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
