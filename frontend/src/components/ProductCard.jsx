// ─────────────────────────────────────────────────────────────────
// ProductCard.jsx — Card de exibição de produto
//
// Renderiza as informações de um único produto em formato de card,
// utilizado nas grades do catálogo, carrossel, home e páginas de
// lançamentos/promoções.
//
// Props:
//  - product    (object, obrigatório): dados do produto
//                { id, name, ref, image, price, category }
//  - onAddToCart (function, obrigatório): callback chamado ao clicar
//                em "Adicionar ao Carrinho"
//  - variant    (string): 'default' | 'launch' | 'promo'
//                Controla classes CSS de variante visual
//  - badgeText  (string): texto do badge (ex.: "Novo", "Oferta")
//                Se vazio, o badge não é renderizado
//  - oldPrice   (number|null): preço antigo para exibir risco (promoções)
//  - layout     (string): 'grid' | 'list'
//                Alterna entre layout em grade e em lista
//
// Para adicionar mais informações (ex.: avaliações), inclua-as
// dentro da div.product-info abaixo.
// ─────────────────────────────────────────────────────────────────

import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

// Props recebidas pelo componente (com valores padrão)
export default function ProductCard({
  product,
  onAddToCart,
  variant = 'default',      // Variante visual: 'default', 'launch' ou 'promo'
  badgeText = '',           // Texto do badge; sem texto = sem badge
  oldPrice = null,          // Preço antigo (null = não exibe preço riscado)
  layout = 'grid',          // Modo de layout: 'grid' (padrão) ou 'list'
}) {
  // Formata o preço no padrão brasileiro com símbolo de moeda (R$)
  const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Calcula o valor de cada parcela em 6x sem juros e formata
  const installmentPrice = (product.price / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Formata o preço antigo (riscado) apenas se fornecido
  const formattedOldPrice = oldPrice
    ? oldPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  // Classe CSS extra para o layout em lista; vazio para grid
  const layoutClass = layout === 'list' ? 'product-card--layout-list' : '';

  return (
    // Container principal: combina classes de variante e layout
    <div
      className={`product-card ${variant !== 'default' ? `product-card-${variant}` : ''} ${layoutClass}`.trim()}
    >
      {/* Badge de destaque (ex.: "Novo", "Oferta") — só exibido se badgeText não estiver vazio */}
      {badgeText ? <span className="product-badge">{badgeText}</span> : null}

      {/* Link da imagem: leva à página de detalhes do produto */}
      <Link to={`/produto/${product.id}`} className="product-link">
        <div className="image-container">
          <img src={product.image} alt={product.name} className="product-image" />
          {/* Overlay de adição rápida — aparece no hover pelo CSS */}
          {layout !== 'list' && (
            <div className="product-card-overlay">
              <button
                type="button"
                className="btn-quick-add"
                onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
                aria-label={`Adicionar ${product.name} ao carrinho`}
              >
                + Adicionar ao Carrinho
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Área de informações textuais do produto */}
      <div className="product-info">
        {/* Nome e referência do produto — clicável, leva à página de detalhes */}
        <Link to={`/produto/${product.id}`} className="product-link">
          <p className="product-ref">{product.ref}: {product.name}</p>
        </Link>

        {/* Indicador de condição de pagamento à vista */}
        <p className="payment-method">À vista com desconto</p>

        {/* Preço antigo riscado — só exibido quando oldPrice é informado (modo promoção) */}
        {formattedOldPrice ? <p className="product-old-price">{formattedOldPrice}</p> : null}

        {/* Preço atual em destaque */}
        <p className="product-price">{formattedPrice}</p>

        {/* Parcelamento: calculado como price / 6 sem juros */}
        <p className="product-installments">Em até 6x de {installmentPrice} sem juros</p>

        {/* Botão de adicionar ao carrinho: chama o callback do pai com o produto completo */}
        <button className="btn-gold" onClick={() => onAddToCart(product)}>
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
}
