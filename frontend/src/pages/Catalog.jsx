import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaListUl, FaTh, FaFilter, FaBoxOpen } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import './Catalog.css';

const itemsPerPage = 12;
const VIEW_STORAGE_KEY = 'catalogLayoutMode';

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const normalizeText = (value) => String(value || '').toLowerCase().trim();

function SkeletonCard() {
  return <div className="catalog-skeleton-card" aria-hidden="true" />;
}

export default function Catalog({
  onAddToCart,
  products = [],
  isLoadingProducts,
  productsError,
  pageTitle = 'Catálogo',
  pageSubtitle = 'Filtre por nome, referência, categoria ou faixa de preço',
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

  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = sessionStorage.getItem(VIEW_STORAGE_KEY);
      return saved === 'list' || saved === 'grid' ? saved : 'grid';
    } catch {
      return 'grid';
    }
  });

  const forcedCategory = forcedFilters.category || '';
  const forcedMinPrice = toNumberOrNull(forcedFilters.minPrice);
  const forcedMaxPrice = toNumberOrNull(forcedFilters.maxPrice);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    try { sessionStorage.setItem(VIEW_STORAGE_KEY, viewMode); } catch { /* ignore */ }
  }, [viewMode]);

  const effectiveFilters = useMemo(() => {
    const querySearch   = searchParams.get('q')        || initialFilters.q        || '';
    const queryCategory = searchParams.get('category') || initialFilters.category || '';
    const queryMinPrice = searchParams.get('min')      ?? initialFilters.minPrice  ?? '';
    const queryMaxPrice = searchParams.get('max')      ?? initialFilters.maxPrice  ?? '';
    const querySort     = searchParams.get('sort')     || initialFilters.sortBy    || 'relevance';
    return {
      q:        querySearch,
      category: forcedCategory || queryCategory,
      minPrice: forcedMinPrice ?? toNumberOrNull(queryMinPrice),
      maxPrice: forcedMaxPrice ?? toNumberOrNull(queryMaxPrice),
      sortBy:   querySort,
    };
  }, [searchParams, initialFilters, forcedCategory, forcedMinPrice, forcedMaxPrice]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch   = normalizeText(effectiveFilters.q);
    const normalizedCategory = normalizeText(effectiveFilters.category);

    const results = products.filter((product) => {
      const searchableText  = `${product.name} ${product.ref} ${product.category}`;
      const hasSearch       = normalizedSearch   ? normalizeText(searchableText).includes(normalizedSearch) : true;
      const hasCategory     = normalizedCategory ? normalizeText(product.category) === normalizedCategory   : true;
      const hasMinPrice     = effectiveFilters.minPrice !== null ? product.price >= effectiveFilters.minPrice : true;
      const hasMaxPrice     = effectiveFilters.maxPrice !== null ? product.price <= effectiveFilters.maxPrice : true;
      return hasSearch && hasCategory && hasMinPrice && hasMaxPrice;
    });

    if (effectiveFilters.sortBy === 'price-asc')  return [...results].sort((a, b) => a.price - b.price);
    if (effectiveFilters.sortBy === 'price-desc') return [...results].sort((a, b) => b.price - a.price);
    if (effectiveFilters.sortBy === 'name-asc')   return [...results].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    if (effectiveFilters.sortBy === 'newest')     return [...results].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return results;
  }, [products, effectiveFilters]);

  const totalPages      = Math.ceil(filteredProducts.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const indexOfLast     = safeCurrentPage * itemsPerPage;
  const currentItems    = filteredProducts.slice(indexOfLast - itemsPerPage, indexOfLast);

  // Conta filtros ativos para badge no botão mobile
  const activeFilterCount = [
    effectiveFilters.q,
    !forcedCategory && effectiveFilters.category,
    !forcedMinPrice && effectiveFilters.minPrice !== null,
    !forcedMaxPrice && effectiveFilters.maxPrice !== null,
    effectiveFilters.sortBy !== 'relevance',
  ].filter(Boolean).length;

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyFilters = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams();
    const fd = new FormData(event.currentTarget);
    const q        = String(fd.get('q')        || '').trim();
    const category = String(fd.get('category') || '').trim();
    const min      = String(fd.get('min')      || '').trim();
    const max      = String(fd.get('max')      || '').trim();
    const sort     = String(fd.get('sort')     || '').trim();
    if (q)                    nextParams.set('q',        q);
    if (category)             nextParams.set('category', category);
    if (min)                  nextParams.set('min',      min);
    if (max)                  nextParams.set('max',      max);
    if (sort && sort !== 'relevance') nextParams.set('sort', sort);
    setSearchParams(nextParams);
    setCurrentPage(1);
    setIsMobileFilterOpen(false);
  };

  const clearFilters = () => {
    filterFormRef.current?.reset();
    setSearchParams(new URLSearchParams());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(1);
  };

  const getCardProps = (product) => {
    if (pageVariant === 'promo')  return { variant: 'promo',   badgeText: 'Oferta', oldPrice: Number((product.price * 1.16).toFixed(2)) };
    if (pageVariant === 'launch') return { variant: 'launch',  badgeText: 'Novo' };
    return { variant: 'default', badgeText: '', oldPrice: null };
  };

  return (
    <main className={`container catalog-page page-${pageVariant}`}>

      {/* ── Cabeçalho ── */}
      <header className="catalog-hero">
        <div className="catalog-hero-text">
          <h1 className="catalog-title">{pageTitle}</h1>
          <p className="catalog-subtitle">{pageSubtitle}</p>
        </div>
      </header>

      {/* ── Banner de erro ── */}
      {productsError && (
        <p className="catalog-banner catalog-banner--warn" role="alert">{productsError}</p>
      )}

      {/* ── Layout: filtros + conteúdo ── */}
      <div className={`catalog-layout ${showFilters ? '' : 'no-filters'}`}>

        {/* ── Filtros ── */}
        {showFilters && (
          <>
            <button
              type="button"
              className="filter-toggle-mobile"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <span className="filter-toggle-left">
                <FaFilter aria-hidden />
                Filtrar resultados
              </span>
              {activeFilterCount > 0 && (
                <span className="filter-toggle-badge">{activeFilterCount}</span>
              )}
            </button>

            <aside className={`catalog-filters ${isMobileFilterOpen ? 'is-open' : ''}`}>
              <div className="filters-header-mobile">
                <h3>Filtros</h3>
                <button type="button" onClick={() => setIsMobileFilterOpen(false)}>Fechar ✕</button>
              </div>

              <form ref={filterFormRef} onSubmit={applyFilters}>
                <h3 className="filters-title-desktop">Filtros</h3>

                <label htmlFor="search-input">Nome ou referência</label>
                <input
                  name="q"
                  id="search-input"
                  type="text"
                  defaultValue={effectiveFilters.q}
                  placeholder="Ex.: produto, REF-001"
                />

                <label htmlFor="category-select">Categoria</label>
                <select
                  name="category"
                  id="category-select"
                  defaultValue={effectiveFilters.category}
                  disabled={Boolean(forcedCategory)}
                >
                  <option value="">Todas</option>
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
                <select name="sort" id="sort-select" defaultValue={effectiveFilters.sortBy}>
                  <option value="relevance">Relevância</option>
                  <option value="newest">Mais recentes</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="name-asc">Nome (A-Z)</option>
                </select>

                <button type="submit" className="btn-gold filter-btn">Aplicar filtros</button>
                <button type="button" className="clear-filter-btn" onClick={clearFilters}>Limpar filtros</button>
              </form>
            </aside>

            {isMobileFilterOpen && (
              <button
                type="button"
                className="mobile-filter-overlay"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Fechar filtros"
              />
            )}
          </>
        )}

        {/* ── Área de conteúdo ── */}
        <section className="catalog-content">

          {/* Toolbar: contador + toggle de visualização */}
          {!isLoadingProducts && (
            <div className="catalog-view-toolbar">
              <span className="catalog-results-count">
                {filteredProducts.length === 0
                  ? 'Nenhum produto'
                  : `${filteredProducts.length} produto${filteredProducts.length > 1 ? 's' : ''}`}
              </span>
              <div className="catalog-toolbar-right">
                <div className="catalog-view-toggle" role="group" aria-label="Modo de visualização">
                  <button
                    type="button"
                    className={`catalog-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    title="Grade"
                  >
                    <FaTh aria-hidden /> Grade
                  </button>
                  <button
                    type="button"
                    className={`catalog-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                    title="Lista"
                  >
                    <FaListUl aria-hidden /> Lista
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Skeleton loading */}
          {isLoadingProducts && (
            <div className="catalog-grid catalog-grid--grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Estado vazio */}
          {!isLoadingProducts && currentItems.length === 0 && (
            <div className="catalog-empty-state">
              <div className="catalog-empty-icon"><FaBoxOpen /></div>
              <h3>Nenhum produto encontrado</h3>
              <p>Tente ajustar os filtros para ampliar os resultados.</p>
              {activeFilterCount > 0 && (
                <button type="button" className="catalog-empty-clear" onClick={clearFilters}>
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Grid / lista de produtos */}
          {!isLoadingProducts && currentItems.length > 0 && (
            <div className={`catalog-grid catalog-grid--${viewMode}`}>
              {currentItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  layout={viewMode}
                  {...getCardProps(product)}
                />
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                onClick={() => paginate(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="page-btn"
              >
                ← Anterior
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  type="button"
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`page-btn ${safeCurrentPage === i + 1 ? 'active' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => paginate(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="page-btn"
              >
                Próxima →
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
