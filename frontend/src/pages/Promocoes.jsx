import React from 'react';
import Catalog from './Catalog';

export default function Promocoes(props) {
  return (
    <Catalog
      {...props}
      pageTitle="Promoções"
      pageSubtitle="Ofertas especiais com melhor custo-benefício para sua operação"
      pageVariant="promo"
      showFilters
      forcedFilters={{ maxPrice: 2000 }}
      initialFilters={{ maxPrice: 2000, sortBy: 'price-asc' }}
    />
  );
}
