import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './Catalog.css';

const itemsPerPage = 12;

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
};

const normalizeText = (value) => String(value || '').toLowerCase().trim();

const extractBrand = (product) => {
  if (product?.brand) return String(product.brand).trim();
  const parts = String(product?.name || '').split('-');
  if (parts.length > 1) return parts[parts.length - 1].trim();
  return 'Genuína';
};

export default function Catalog({
  onAddToCart,
  products = [],
  isLoadingProducts,
  productsError,
  pageTitle = 'Catálogo de Peças',
  pageSubtitle = 'Encontre rapidamente a peça ideal para o seu maquinário',
  pageVariant = 'catalog',
  showFilters = true,
  initialFilters = {},
  forcedFilters = {},
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const initialSearch = new URLSearchParams(window.location.search).get('q') || '';
    return window.innerWidth <= 1024 && Boolean(initialSearch.trim());
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const filterFormRef = useRef(null);

  const forcedCategory = forcedFilters.category || '';
  const forcedBrand = forcedFilters.brand || '';
  const forcedMinPrice = toNumberOrNull(forcedFilters.minPrice);
  const forcedMaxPrice = toNumberOrNull(forcedFilters.maxPrice);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const allBrands = useMemo(() => {
    const brands = products.map(extractBrand).filter(Boolean);
    return [...new Set(brands)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [products]);

  const effectiveFilters = useMemo(() => {
    const querySearch = searchParams.get('q') || initialFilters.q || '';
    const queryBrand = searchParams.get('brand') || initialFilters.brand || '';
    const queryCategory = searchParams.get('category') || initialFilters.category || '';
    const queryMinPrice = searchParams.get('min') ?? initialFilters.minPrice ?? '';
    const queryMaxPrice = searchParams.get('max') ?? initialFilters.maxPrice ?? '';
    const querySort = searchParams.get('sort') || initialFilters.sortBy || 'relevance';

    return {
      q: querySearch,
      brand: forcedBrand || queryBrand,
      category: forcedCategory || queryCategory,
      minPrice: forcedMinPrice ?? toNumberOrNull(queryMinPrice),
      maxPrice: forcedMaxPrice ?? toNumberOrNull(queryMaxPrice),
      sortBy: querySort,
    };
  }, [searchParams, initialFilters, forcedBrand, forcedCategory, forcedMinPrice, forcedMaxPrice]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(effectiveFilters.q);
    const normalizedBrand = normalizeText(effectiveFilters.brand);
    const normalizedCategory = normalizeText(effectiveFilters.category);

    const results = products.filter((product) => {
      const brand = extractBrand(product);
      const searchableText = `${product.name} ${product.ref} ${brand} ${product.category}`;
      const hasSearchMatch = normalizedSearch ? normalizeText(searchableText).includes(normalizedSearch) : true;
      const hasBrandMatch = normalizedBrand ? normalizeText(brand) === normalizedBrand : true;
      const hasCategoryMatch = normalizedCategory ? normalizeText(product.category) === normalizedCategory : true;
      const hasMinPriceMatch = effectiveFilters.minPrice !== null ? product.price >= effectiveFilters.minPrice : true;
      const hasMaxPriceMatch = effectiveFilters.maxPrice !== null ? product.price <= effectiveFilters.maxPrice : true;

      return hasSearchMatch && hasBrandMatch && hasCategoryMatch && hasMinPriceMatch && hasMaxPriceMatch;
    });

    if (effectiveFilters.sortBy === 'price-asc') {
      return [...results].sort((a, b) => a.price - b.price);
    }

    if (effectiveFilters.sortBy === 'price-desc') {
      return [...results].sort((a, b) => b.price - a.price);
    }

    if (effectiveFilters.sortBy === 'name-asc') {
      return [...results].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }

    return results;
  }, [products, effectiveFilters]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const indexOfLastItem = safeCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyFilters = (event) => {
    event.preventDefault();

    const nextParams = new URLSearchParams();

    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') || '').trim();
    const brand = String(formData.get('brand') || '').trim();
    const category = String(formData.get('category') || '').trim();
    const min = String(formData.get('min') || '').trim();
    const max = String(formData.get('max') || '').trim();
    const sort = String(formData.get('sort') || '').trim();

    if (q) nextParams.set('q', q);
    if (brand) nextParams.set('brand', brand);
    if (category) nextParams.set('category', category);
    if (min) nextParams.set('min', min);
    if (max) nextParams.set('max', max);
    if (sort && sort !== 'relevance') nextParams.set('sort', sort);

    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    if (filterFormRef.current) {
      filterFormRef.current.reset();
    }
    setSearchParams(new URLSearchParams());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(1);
  };

  const getCardProps = (product) => {
    if (pageVariant === 'promo') {
      return {
        variant: 'promo',
        badgeText: 'Oferta',
        oldPrice: Number((product.price * 1.16).toFixed(2)),
      };
    }

    if (pageVariant === 'launch') {
      return {
        variant: 'launch',
        badgeText: 'Novo',
      };
    }

    return {
      variant: 'default',
      badgeText: '',
      oldPrice: null,
    };
  };

  return (
    <main className={`container catalog-page page-${pageVariant}`}>
      <header className="catalog-hero">
        <h1 className="catalog-title">{pageTitle}</h1>
        <p className="catalog-subtitle">{pageSubtitle}</p>
        <p className="catalog-subtitle">
          Exibindo {currentItems.length} de {filteredProducts.length} produto(s) filtrado(s)
        </p>
      </header>
      {productsError && (
        <p className="catalog-subtitle" style={{ color: '#ffdd57' }}>
          {productsError}
        </p>
      )}
      {isLoadingProducts && (
        <p className="catalog-subtitle">
          Carregando produtos...
        </p>
      )}

      <div className={`catalog-layout ${showFilters ? '' : 'no-filters'}`}>
        {showFilters ? (
          <>
            <button
              type="button"
              className="filter-toggle-mobile"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              Filtrar resultados
            </button>

            <aside className={`catalog-filters ${isMobileFilterOpen ? 'is-open' : ''}`}>
              <div className="filters-header-mobile">
                <h3>Filtros de Busca</h3>
                <button type="button" onClick={() => setIsMobileFilterOpen(false)}>Fechar</button>
              </div>
              <form ref={filterFormRef} onSubmit={applyFilters}>
                <h3 className="filters-title-desktop">Filtros de Busca</h3>

                <label htmlFor="search-input">Produto ou referência</label>
                <input
                  name="q"
                  id="search-input"
                  type="text"
                  defaultValue={effectiveFilters.q}
                  placeholder="Ex.: bomba, ref, marca"
                />

                <label htmlFor="brand-select">Marca</label>
                <select
                  name="brand"
                  id="brand-select"
                  defaultValue={effectiveFilters.brand}
                  disabled={Boolean(forcedBrand)}
                >
                  <option value="">Todas as marcas</option>
                  {allBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>

                <label htmlFor="category-select">Categoria</label>
                <select
                  name="category"
                  id="category-select"
                  defaultValue={effectiveFilters.category}
                  disabled={Boolean(forcedCategory)}
                >
                  <option value="">Todas as categorias</option>
                  <option value="mais-vendidos">Mais vendidos</option>
                  <option value="novidades">Novidades</option>
                  <option value="geral">Geral</option>
                </select>

                <div className="price-range">
                  <div>
                    <label htmlFor="min-price">Preço mín.</label>
                    <input
                      name="min"
                      id="min-price"
                      type="number"
                      min="0"
                      defaultValue={forcedMinPrice ?? (effectiveFilters.minPrice ?? '')}
                      disabled={forcedMinPrice !== null}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="max-price">Preço máx.</label>
                    <input
                      name="max"
                      id="max-price"
                      type="number"
                      min="0"
                      defaultValue={forcedMaxPrice ?? (effectiveFilters.maxPrice ?? '')}
                      disabled={forcedMaxPrice !== null}
                      placeholder="5000"
                    />
                  </div>
                </div>

                <label htmlFor="sort-select">Ordenar por</label>
                <select
                  name="sort"
                  id="sort-select"
                  defaultValue={effectiveFilters.sortBy}
                >
                  <option value="relevance">Relevância</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="name-asc">Nome (A-Z)</option>
                </select>

                <button type="submit" className="btn-gold filter-btn">Aplicar Filtros</button>
                <button type="button" className="clear-filter-btn" onClick={clearFilters}>Limpar</button>
              </form>
            </aside>
            {isMobileFilterOpen ? (
              <button
                type="button"
                className="mobile-filter-overlay"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Fechar painel de filtros"
              />
            ) : null}
          </>
        ) : null}

        <section className="catalog-content">
          {currentItems.length === 0 ? (
            <div className="catalog-empty-state">
              <h3>Nenhum produto encontrado.</h3>
              <p>Tente ajustar os filtros para ampliar os resultados.</p>
            </div>
          ) : (
            <div className={`catalog-grid ${pageVariant === 'launch' ? 'catalog-grid-launch' : ''}`}>
              {currentItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  {...getCardProps(product)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => paginate(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="page-btn"
              >
                &laquo; Anterior
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={`page-btn ${safeCurrentPage === index + 1 ? 'active' : ''}`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => paginate(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="page-btn"
              >
                Próxima &raquo;
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}