// ─────────────────────────────────────────────────────────────────
// Home.jsx — Página inicial da loja
//
// Exibe a vitrine principal com três seções de produtos:
//  1. Hero: banner de boas-vindas + card de destaque do primeiro produto
//  2. Mais Vendidos: produtos da categoria 'mais-vendidos' (até 10)
//  3. Novidades: 15 produtos mais recentes de qualquer categoria (carrossel)
//  4. Outras Categorias: produtos da categoria 'geral' (até 10)
//
// Props:
//  - onAddToCart       (function): callback para adicionar produto ao carrinho
//  - products          (array): lista completa de produtos
//  - isLoadingProducts (boolean): true enquanto a API está sendo consultada
//  - productsError     (string): mensagem de erro se a API falhou
//
// Para adicionar uma nova seção de produtos, copie um bloco
// <section className="product-section"> e filtre os produtos como desejar.
// ─────────────────────────────────────────────────────────────────

import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import AutoCarousel from '../components/AutoCarousel';
import './Home.css';

// ─── sortByNewest ─────────────────────────────────────────────────
// Ordena a lista de produtos do mais recente para o mais antigo.
// Usa o campo createdAt (ISO string) se disponível; caso contrário,
// usa o id em ordem decrescente como proxy de recência.
// Retorna um novo array sem mutação do original.
/**
 * Ordena produtos pela data de criação mais recente.
 * Usa createdAt se disponível, senão usa id decrescente como proxy.
 */
function sortByNewest(list) {
  return [...list].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

// Props recebidas do App.jsx
export default function Home({ onAddToCart, products, isLoadingProducts, productsError }) {
  // Produto em destaque no hero: o primeiro da lista (o mais recente ou o de maior id)
  const heroProduct = products[0];

  // "Mais vendidos" — categoria filtrada, máximo 10
  const maisVendidos = products
    .filter(p => p.category === 'mais-vendidos')
    .slice(0, 10);

  // "Novidades" — 15 produtos mais recentes (qualquer categoria)
  const novidades = sortByNewest(products).slice(0, 15);

  // "Outras categorias" — categoria geral, máximo 10
  const gerais = products
    .filter(p => p.category === 'geral')
    .slice(0, 10);

  return (
    <main className="home-main">
      {/* ── Seção hero: banner de boas-vindas + produto em destaque ── */}
      <section className="home-hero container">
        {/* Coluna esquerda: texto de apresentação e chamadas para ação */}
        <div className="hero-content">
          <p className="hero-kicker">Bem-vindo</p>
          <h1>Produtos com <span className="highlight-text">qualidade</span> e preço justo</h1>
          <p className="hero-description">
            Navegue pelo catálogo, compare opções e monte seu pedido com poucos cliques.
            Este layout é um ponto de partida — adapte textos e categorias ao seu negócio.
          </p>
          {/* Botões de ação: catálogo completo e página de ofertas */}
          <div className="hero-actions">
            <Link to="/catalogo" className="btn-view-all">Ver catálogo</Link>
            <Link to="/promocoes" className="hero-link-secondary">Ver ofertas</Link>
          </div>
        </div>

        {/* Coluna direita: card de destaque com o primeiro produto da lista */}
        <div className="hero-highlight-card">
          {/* Só renderiza o card se houver ao menos um produto carregado */}
          {heroProduct ? (
            <>
              <p className="hero-highlight-tag">Destaque</p>
              <img src={heroProduct.image} alt="" className="hero-highlight-image" />
              <h3>{heroProduct.name}</h3>
              <p className="hero-highlight-ref">Ref. {heroProduct.ref}</p>
              <p className="hero-highlight-price">
                {heroProduct.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              {/* Adiciona o produto em destaque ao carrinho com quantidade 1 */}
              <button type="button" className="btn-gold" onClick={() => onAddToCart(heroProduct)}>
                Adicionar ao carrinho
              </button>
            </>
          ) : null}
        </div>
      </section>

      {/* ── Container principal das seções de produto ── */}
      <div className="container home-container">
        {/* Banner de aviso: exibido quando a API falha e usa dados locais */}
        {productsError ? (
          <p className="home-banner home-banner--warn">
            {productsError}
          </p>
        ) : null}

        {/* Banner de carregamento: exibido enquanto a API responde */}
        {isLoadingProducts ? (
          <p className="home-banner">Carregando produtos…</p>
        ) : null}

        {/* ── Seção "Mais Vendidos" ── */}
        <section className="product-section">
          <h2>Mais <span className="highlight-text">vendidos</span></h2>
          <p className="section-subtitle">Itens populares entre os clientes — ideal para vitrine na home.</p>
          {/* Grade responsiva com até 10 produtos da categoria 'mais-vendidos' */}
          <div className="home-product-grid">
            {maisVendidos.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        </section>

        {/* ── Seção "Novidades" com carrossel automático ── */}
        <section className="product-section">
          <h2><span className="highlight-text">Novidades</span></h2>
          <p className="section-subtitle">Os 15 produtos mais recentes do catálogo, atualizados automaticamente.</p>
          {/* AutoCarousel exibe produtos com scroll automático a cada 3s */}
          <AutoCarousel products={novidades} onAddToCart={onAddToCart} />
        </section>

        {/* ── Seção "Outras Categorias" com link para catálogo completo ── */}
        <section className="product-section product-section-alt">
          <h2>Outras <span className="highlight-text">categorias</span></h2>
          <p className="section-subtitle">Seleção geral do catálogo.</p>
          {/* Grade com produtos da categoria 'geral' */}
          <div className="home-product-grid">
            {gerais.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>

          {/* Link centralizado para o catálogo completo */}
          <div className="view-all-container">
            <Link to="/catalogo" className="btn-view-all">Ver catálogo completo</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
