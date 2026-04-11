import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BrandsCarousel.css';

const fallbackBrands = ['MAHLE', 'DISA', 'NTN', 'BOSCH', 'CATERPILLAR', 'KOMATSU', 'CUMMINS', 'JCB'];

const extractBrand = (product) => {
  if (product?.brand) return String(product.brand).toUpperCase();
  const parts = String(product?.name || '').split('-');
  if (parts.length > 1) return parts[parts.length - 1].trim().toUpperCase();
  return 'GENUINA';
};

export default function BrandsCarousel({ products = [] }) {
  const navigate = useNavigate();
  const brands = React.useMemo(() => {
    const source = products.length > 0 ? products.map(extractBrand) : fallbackBrands;
    return [...new Set(source)].filter(Boolean);
  }, [products]);

  return (
    <div className="brands-container">
      <div className="brands-track">
        {[...brands, ...brands].map((brand, index) => (
          <button
            key={`${brand}-${index}`}
            type="button"
            className="brand-block"
            onClick={() => navigate(`/catalogo?brand=${encodeURIComponent(brand)}`)}
          >
            <span>{brand}</span>
          </button>
        ))}
      </div>
    </div>
  );
}