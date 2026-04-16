// ─────────────────────────────────────────────────────────────────
// ProductDetails.jsx — Página de detalhes de um produto
//
// Exibe todas as informações de um produto específico, acessado via
// URL /produto/:id. Inclui imagem, preço, seletor de quantidade,
// botões de ação, simulação de frete, descrição e carrossel de
// produtos relacionados (mesma categoria).
//
// Estrutura:
//  - ProductDetails (componente exportado): lê o :id da URL,
//    mostra loading e delega para ProductDetailsContent
//  - ProductDetailsContent (componente interno): renderiza o conteúdo
//    real do produto após os dados estarem disponíveis
//
// Props de ProductDetails:
//  - onAddToCart       (function): callback para adicionar ao carrinho
//  - products          (array): lista completa de produtos
//  - isLoadingProducts (boolean): true enquanto a API carrega
//
// Para adicionar abas (ex.: especificações, avaliações), crie seções
// abaixo do product-description-box.
// ─────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTruck, FaClipboardList } from 'react-icons/fa';
import AutoCarousel from '../components/AutoCarousel';
import './ProductDetails.css';

// ─── ProductDetailsContent ────────────────────────────────────────
// Componente interno que renderiza os detalhes do produto.
// Separado do componente exportado para que o `key={id}` no pai
// force uma remontagem completa ao navegar entre produtos.
//
// Props:
//  - productId   (string): id do produto lido da URL
//  - onAddToCart (function): callback para adicionar ao carrinho
//  - products    (array): lista completa de produtos
function ProductDetailsContent({ productId, onAddToCart, products = [] }) {
  // Quantidade selecionada pelo usuário (mínimo 1)
  const [quantity, setQuantity] = useState(1);

  // useNavigate para redirecionar ao checkout após "Comprar agora"
  const navigate = useNavigate();

  // Busca o produto pelo id (comparação como string para robustez)
  const product = products?.find((p) => String(p.id) === String(productId));

  // Produtos da mesma categoria, excluindo o produto atual
  const relatedProducts =
    products?.filter((p) => p.category === product?.category && p.id !== product?.id) || [];

  // ─── Scroll para o topo ao carregar o produto ─────────────────
  // Garante que ao acessar a página de detalhes a tela começa no topo.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── handleComprarAgora ───────────────────────────────────────
  // Adiciona o produto com a quantidade selecionada ao carrinho
  // e redireciona diretamente para o checkout.
  const handleComprarAgora = () => {
    onAddToCart(product, quantity);
    navigate('/checkout');
  };

  // Produto não encontrado: exibe mensagem de erro
  if (!product) {
    return (
      <div className="container details-loading">
        Produto não encontrado.
      </div>
    );
  }

  // Formata o preço no padrão brasileiro (R$)
  const formattedPrice = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ─── decreaseQuantity ─────────────────────────────────────────
  // Diminui a quantidade em 1, respeitando o mínimo de 1 unidade.
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  // ─── increaseQuantity ─────────────────────────────────────────
  // Aumenta a quantidade em 1 (sem limite superior — ajuste se necessário).
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  return (
    <main className="container details-page">
      {/* ── Layout principal: imagem à esquerda, informações à direita ── */}
      <div className="product-layout">

        {/* Área da imagem do produto */}
        <div className="product-image-container">
          {/* alt vazio pois a imagem é decorativa (o nome já está no h1 abaixo) */}
          <img src={product.image} alt="" className="product-main-image" />
        </div>

        {/* Área de informações e ações do produto */}
        <div className="product-info-container">
          {/* Nome do produto */}
          <h1 className="details-title">{product.name}</h1>
          {/* Código de referência do produto */}
          <p className="details-ref">
            Código / ref.: <span className="highlight-text">{product.ref}</span>
          </p>
          <hr className="divider" />

          {/* Bloco de preços */}
          <div className="price-box">
            <p className="details-price">{formattedPrice}</p>
            <p className="details-pix">À vista no boleto ou PIX com condição promocional (configure no seu projeto).</p>
            <p className="details-installments">Parcelamento conforme política da loja</p>
          </div>

          {/* Calculadora de frete por CEP (UI apenas — integração pendente) */}
          <div className="shipping-calc">
            <p className="shipping-calc-title">
              <FaTruck size={18} color="var(--primary)" aria-hidden />
              Simule frete e prazo
            </p>
            <div className="cep-input">
              <input type="text" placeholder="CEP" aria-label="CEP para cálculo de frete" />
              <button type="button">Calcular</button>
            </div>
          </div>

          {/* Seletor de quantidade com botões de incremento/decremento */}
          <div className="quantity-selector-container">
            <span className="quantity-label">Quantidade</span>
            <div className="quantity-controls">
              {/* Diminui quantidade (respeitando mínimo de 1) */}
              <button type="button" onClick={decreaseQuantity} aria-label="Diminuir">−</button>
              {/* Exibe a quantidade atual */}
              <span className="quantity-display">{quantity}</span>
              {/* Aumenta quantidade */}
              <button type="button" onClick={increaseQuantity} aria-label="Aumentar">+</button>
            </div>
          </div>

          {/* Botões de ação: compra direta ou adição ao carrinho */}
          <div className="action-buttons">
            {/* "Comprar agora": adiciona ao carrinho e vai para checkout */}
            <button type="button" className="btn-gold btn-large" onClick={handleComprarAgora}>
              Comprar agora
            </button>
            {/* "Adicionar ao carrinho": abre o drawer sem redirecionar */}
            <button type="button" className="btn-outline btn-large" onClick={() => onAddToCart(product, quantity)}>
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>

      {/* ── Caixa de descrição do produto ── */}
      <div className="product-description-box">
        <h3 className="description-heading">
          <FaClipboardList aria-hidden />
          Descrição
        </h3>
        {/* Textos de template — substitua pelas informações reais do produto */}
        <p><strong>Descrição:</strong> Informações do produto — personalize este texto no template.</p>
        <p><strong>Garantia:</strong> Conforme política comercial da sua loja.</p>
        <p>Dúvidas? Inclua aqui canais de atendimento (chat, e-mail ou mensagens).</p>
      </div>

      {/* ── Seção de produtos relacionados (mesma categoria) ── */}
      {/* Só renderiza o carrossel se houver produtos relacionados */}
      {relatedProducts.length > 0 ? (
        <section className="related-section">
          <h2>Relacionados</h2>
          <p className="section-subtitle related-subtitle">Outros itens na mesma categoria</p>
          <AutoCarousel products={relatedProducts} onAddToCart={onAddToCart} />
        </section>
      ) : null}
    </main>
  );
}

// ─── ProductDetails (componente exportado) ────────────────────────
// Lê o :id da URL e gerencia o estado de carregamento.
// Usa key={id} no ProductDetailsContent para forçar remontagem
// completa ao navegar entre produtos diferentes, evitando que
// o estado de quantidade fique "preso" no valor anterior.
export default function ProductDetails({ onAddToCart, products = [], isLoadingProducts }) {
  // Lê o parâmetro dinâmico :id definido na rota /produto/:id
  const { id } = useParams();

  // Exibe loading enquanto a lista de produtos ainda está sendo carregada
  if (isLoadingProducts) {
    return (
      <div className="container details-loading">
        Carregando produto…
      </div>
    );
  }

  // Renderiza o conteúdo; key={id} garante remontagem ao trocar de produto
  return (
    <ProductDetailsContent
      key={id}
      productId={id}
      onAddToCart={onAddToCart}
      products={products}
    />
  );
}
