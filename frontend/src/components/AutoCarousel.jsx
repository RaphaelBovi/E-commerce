import React, { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ProductCard from './ProductCard';
import './AutoCarousel.css';

export default function AutoCarousel({ products, onAddToCart }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const getItemWidth = () => {
    if (scrollRef.current) {
      const item = scrollRef.current.querySelector('.carousel-item');
      if (item) {
        return item.offsetWidth + 24; 
      }
    }
    return 300;
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const itemWidth = getItemWidth();
      const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const itemWidth = getItemWidth();
      const { scrollLeft } = scrollRef.current;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const itemWidth = getItemWidth();

        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="carousel-wrapper">
      <button className="carousel-arrow left-arrow" onClick={() => scroll('left')}>
        <FaChevronLeft />
      </button>
      <div 
        className="auto-carousel" 
        ref={scrollRef} 
        onScroll={handleScroll}
      >
        <div className="responsive-grid carousel-grid">
          {products.map(product => (
            <div key={product.id} className="carousel-item">
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      </div>
      <button className="carousel-arrow right-arrow" onClick={() => scroll('right')}>
        <FaChevronRight />
      </button>
      <div className="carousel-dots">
        {products.map((_, index) => (
          <span 
            key={index} 
            className={`dot ${activeIndex === index ? 'active' : ''}`}
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