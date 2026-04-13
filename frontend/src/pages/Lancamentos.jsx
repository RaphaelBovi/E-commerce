import React from 'react';
import Catalog from './Catalog';

export default function Lancamentos(props) {
  return (
    <Catalog
      {...props}
      pageTitle="Novidades"
      pageSubtitle="Itens recentes no catálogo — personalize filtros e categorias no template"
      pageVariant="launch"
      showFilters={false}
      forcedFilters={{ category: 'novidades' }}
      initialFilters={{ category: 'novidades', sortBy: 'name-asc' }}
    />
  );
}
