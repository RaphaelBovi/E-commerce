// ─────────────────────────────────────────────────────────────────
// AutoCarousel.jsx — Carrossel automático de produtos
//
// Exibe uma lista de produtos em um carrossel com scroll horizontal
// que avança automaticamente a cada 3 segundos. O usuário pode
// interagir via botões de seta, clique nos indicadores (dots)
// ou scroll manual.
//
// Props:
//  - products    (array, obrigatório): lista de produtos para exibir
//  - onAddToCart (function, obrigatório): callback repassado ao ProductCard
//
// Para alterar o intervalo de avanço automático, mude o valor 3000
// (milissegundos) no setInterval abaixo.
// Para mudar quantos itens aparecem por vez, ajuste as classes CSS
// em AutoCarousel.css (.carousel-item flex).
// ─────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ProductCard from './ProductCard';
import './AutoCarousel.css';

// Props: products (lista de produtos) e onAddToCart (callback do carrinho)
export default function AutoCarousel({ products, onAddToCart }) {
  // Referência direta ao elemento DOM do carrossel para controlar scroll
  const scrollRef = useRef(null);

  // Índice do item atualmente visível (usado para destacar o dot ativo)
  const [activeIndex, setActiveIndex] = useState(0);

  // ─── getItemWidth ──────────────────────────────────────────────
  // Calcula a largura de um item do carrossel (incluindo o gap de 24px).
  // Busca o primeiro elemento .carousel-item dentro do scroll container.
  // Retorna 300 como fallback se o elemento ainda não estiver disponível.
  const getItemWidth = () => {
    if (scrollRef.current) {
      const item = scrollRef.current.querySelector('.carousel-item');
      if (item) {
        return item.offsetWidth + 24; // 24px = gap entre os itens (definido no CSS)
      }
    }
    return 300; // Valor padrão enquanto o DOM não está pronto
  };

  // ─── scroll ───────────────────────────────────────────────────
  // Avança ou recua o carrossel em exatamente 1 item.
  // direction: 'left' recua; 'right' avança.
  const scroll = (direction) => {
    if (scrollRef.current) {
      const itemWidth = getItemWidth();
      const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // ─── handleScroll ─────────────────────────────────────────────
  // Disparado sempre que o usuário rola manualmente o carrossel.
  // Atualiza o activeIndex com base na posição de scroll atual,
  // mantendo os dots sincronizados com o item visível.
  const handleScroll = () => {
    if (scrollRef.current) {
      const itemWidth = getItemWidth();
      const { scrollLeft } = scrollRef.current;
      // Math.round garante que o índice não flutue entre dois valores
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(newIndex);
    }
  };

  // ─── Auto-scroll ──────────────────────────────────────────────
  // Executa ao montar o componente e cria um intervalo de 3 segundos.
  // A cada tick, verifica se chegou ao final e reinicia do começo,
  // criando um efeito de loop infinito.
  // O cleanup (clearInterval) é chamado ao desmontar para evitar
  // memory leaks quando o componente sair da tela.
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const itemWidth = getItemWidth();

        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          // Chegou ao final: volta suavemente para o início
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Ainda há itens: avança um item para a direita
          scrollRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
      }
    }, 3000); // Intervalo em milissegundos — altere aqui para mudar a velocidade

    // Cleanup: remove o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId);
  }, []); // Array vazio: executa apenas uma vez na montagem

  return (
    <div className="carousel-wrapper">
      {/* Botão de seta esquerda para navegar manualmente */}
      <button className="carousel-arrow left-arrow" onClick={() => scroll('left')}>
        <FaChevronLeft />
      </button>

      {/* Container com scroll horizontal — referenciado pelo scrollRef */}
      <div
        className="auto-carousel"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* Grid flex com todos os itens do carrossel */}
        <div className="responsive-grid carousel-grid">
          {products.map(product => (
            // Cada item ocupa um slot fixo no carrossel (largura definida no CSS)
            <div key={product.id} className="carousel-item">
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      </div>

      {/* Botão de seta direita para navegar manualmente */}
      <button className="carousel-arrow right-arrow" onClick={() => scroll('right')}>
        <FaChevronRight />
      </button>

      {/* Indicadores de posição (dots): um por produto */}
      <div className="carousel-dots">
        {products.map((_, index) => (
          <span
            key={index}
            // Adiciona a classe 'active' no dot correspondente ao item visível
            className={`dot ${activeIndex === index ? 'active' : ''}`}
            // Clicar no dot rola o carrossel diretamente para aquele item
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ left: index * getItemWidth(), behavior: 'smooth' });
              }
            }}
            style={{ cursor: 'pointer' }}
          ></span>
        ))}
      </div>
    </div>
  );
}
