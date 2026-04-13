import React from 'react';
import Catalog from './Catalog';

export default function Promocoes(props) {
  return (
    <Catalog
      {...props}
      pageTitle="Ofertas"
      pageSubtitle="Seleção com faixa de preço promocional — ajuste regras conforme sua loja"
      pageVariant="promo"
      showFilters
      forcedFilters={{ maxPrice: 2000 }}
      initialFilters={{ maxPrice: 2000, sortBy: 'price-asc' }}
    />
  );
}
