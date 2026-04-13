import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import AutoCarousel from '../components/AutoCarousel';
import './Home.css';

export default function Home({ onAddToCart, products, isLoadingProducts, productsError }) {
  const heroProduct = products[0];
  const maisVendidos = products.filter(p => p.category === 'mais-vendidos').slice(0, 8);
  const novidades = products.filter(p => p.category === 'novidades');
  const gerais = products.filter(p => p.category === 'geral').slice(0, 6);

  return (
    <main className="home-main">
      <section className="home-hero container">
        <div className="hero-content">
          <p className="hero-kicker">Bem-vindo</p>
          <h1>Produtos com <span className="highlight-text">qualidade</span> e preço justo</h1>
          <p className="hero-description">
            Navegue pelo catálogo, compare opções e monte seu pedido com poucos cliques.
            Este layout é um ponto de partida — adapte textos e categorias ao seu negócio.
          </p>
          <div className="hero-actions">
            <Link to="/catalogo" className="btn-view-all">Ver catálogo</Link>
            <Link to="/promocoes" className="hero-link-secondary">Ver ofertas</Link>
          </div>
        </div>

        <div className="hero-highlight-card">
          {heroProduct ? (
            <>
              <p className="hero-highlight-tag">Destaque</p>
              <img src={heroProduct.image} alt="" className="hero-highlight-image" />
              <h3>{heroProduct.name}</h3>
              <p className="hero-highlight-ref">Ref. {heroProduct.ref}</p>
              <p className="hero-highlight-price">
                {heroProduct.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <button type="button" className="btn-gold" onClick={() => onAddToCart(heroProduct)}>
                Adicionar ao carrinho
              </button>
            </>
          ) : null}
        </div>
      </section>

      <div className="container home-container">
        {productsError ? (
          <p className="home-banner home-banner--warn">
            {productsError}
          </p>
        ) : null}
        {isLoadingProducts ? (
          <p className="home-banner">Carregando produtos…</p>
        ) : null}

        <section className="product-section">
          <h2>Mais <span className="highlight-text">vendidos</span></h2>
          <p className="section-subtitle">Itens populares entre os clientes — ideal para vitrine na home.</p>
          <div className="responsive-grid home-product-grid">
            {maisVendidos.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        </section>

        <section className="product-section">
          <h2><span className="highlight-text">Novidades</span></h2>
          <p className="section-subtitle">Lançamentos e entradas recentes no estoque.</p>
          <AutoCarousel products={novidades} onAddToCart={onAddToCart} />
        </section>

        <section className="product-section product-section-alt">
          <h2>Outras <span className="highlight-text">categorias</span></h2>
          <p className="section-subtitle">Seleção geral do catálogo.</p>
          <div className="responsive-grid home-product-grid">
            {gerais.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>

          <div className="view-all-container">
            <Link to="/catalogo" className="btn-view-all">Ver catálogo completo</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
