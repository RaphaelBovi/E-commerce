import React from 'react';
import Catalog from './Catalog';

export default function Lancamentos(props) {
  return (
    <Catalog
      {...props}
      pageTitle="Novidades"
      pageSubtitle="Os produtos adicionados mais recentemente ao catálogo"
      pageVariant="launch"
      initialFilters={{ sortBy: 'newest' }}
    />
  );
}
