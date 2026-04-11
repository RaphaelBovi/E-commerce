import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import AutoCarousel from '../components/AutoCarousel';
import BrandsCarousel from '../components/BrandsCarousel'; 
import './Home.css';

export default function Home({ onAddToCart, products, isLoadingProducts, productsError }) {
  const heroProduct = products[0];
  const maisVendidos = products.filter(p => p.category === 'mais-vendidos').slice(0, 8);
  const novidades = products.filter(p => p.category === 'novidades');
  const gerais = products.filter(p => p.category === 'geral').slice(0, 6);

  return (
    <main>
      <BrandsCarousel products={products} /> 

      <section className="home-hero container">
        <div className="hero-content">
          <p className="hero-kicker">Distribuidora especializada</p>
          <h1>Performance para seu <span className="highlight-text">maquinário pesado</span></h1>
          <p className="hero-description">
            Peças técnicas, marcas reconhecidas e envio rápido para manter sua operação sem parada.
          </p>
          <div className="hero-actions">
            <Link to="/catalogo" className="btn-view-all">Explorar peças</Link>
            <Link to="/promocoes" className="hero-link-secondary">Ver promoções</Link>
          </div>
        </div>

        <div className="hero-highlight-card">
          {heroProduct ? (
            <>
              <p className="hero-highlight-tag">Destaque da semana</p>
              <img src={heroProduct.image} alt={heroProduct.name} className="hero-highlight-image" />
              <h3>{heroProduct.name}</h3>
              <p className="hero-highlight-ref">Ref: {heroProduct.ref}</p>
              <p className="hero-highlight-price">
                {heroProduct.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <button className="btn-gold" onClick={() => onAddToCart(heroProduct)}>
                Adicionar ao carrinho
              </button>
            </>
          ) : null}
        </div>
      </section>

      <div className="container home-container">
        {productsError && (
          <p className="section-subtitle" style={{ marginBottom: '1rem', color: '#ffdd57' }}>
            {productsError}
          </p>
        )}
        {isLoadingProducts && (
          <p className="section-subtitle" style={{ marginBottom: '1rem' }}>
            Carregando produtos...
          </p>
        )}
        
        <section className="product-section">
          <h2>Mais <span className="highlight-text">vendidos</span></h2>
          <p className="section-subtitle">Os itens de maior giro para reposição rápida e manutenção eficiente</p>
          <div className="responsive-grid">
            {maisVendidos.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        </section>
        <section className="product-section">
          <h2><span className="highlight-text">Novidades</span> em alta</h2>
          <p className="section-subtitle">Lançamentos recentes com tecnologia e desempenho atualizados</p>
          <AutoCarousel products={novidades} onAddToCart={onAddToCart} />
        </section>

        <section className="product-section product-section-alt">
          <h2>Outras <span className="highlight-text">Peças</span></h2>
          <p className="section-subtitle">Itens gerais para o seu maquinário</p>
          <div className="responsive-grid">
            {gerais.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
          
          <div className="view-all-container">
            <Link to="/catalogo" className="btn-view-all">Ver todas as peças</Link>
          </div>
        </section>
      </div>
    </main>
  );
}