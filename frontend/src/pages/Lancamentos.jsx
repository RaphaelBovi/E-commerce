import React from 'react';
import Catalog from './Catalog';

export default function Lancamentos(props) {
  return (
    <Catalog
      {...props}
      pageTitle="Lançamentos"
      pageSubtitle="Novidades em destaque, com foco em tecnologia e desempenho"
      pageVariant="launch"
      showFilters={false}
      forcedFilters={{ category: 'novidades' }}
      initialFilters={{ category: 'novidades', sortBy: 'name-asc' }}
    />
  );
}
