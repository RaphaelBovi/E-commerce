// ─────────────────────────────────────────────────────────────────
// Catalog.jsx — Página de catálogo com filtros, ordenação e paginação
//
// Componente reutilizável que serve de base para três rotas:
//  - /catalogo   → Catálogo geral (pageVariant='catalog')
//  - /lancamentos → Novidades (pageVariant='launch', sem filtros visíveis)
//  - /promocoes  → Ofertas (pageVariant='promo', preço máximo R$2000)
//
// Props:
//  - onAddToCart       (function): callback para adicionar ao carrinho
//  - products          (array): todos os produtos disponíveis
//  - isLoadingProducts (boolean): true enquanto a API carrega
//  - productsError     (string): mensagem de erro da API
//  - pageTitle         (string): título exibido no cabeçalho
//  - pageSubtitle      (string): subtítulo do cabeçalho
//  - pageVariant       ('catalog'|'launch'|'promo'): controla visual e cardProps
//  - showFilters       (boolean): exibe ou oculta o painel de filtros lateral
//  - initialFilters    (object): filtros padrão ao abrir a página
//  - forcedFilters     (object): filtros que não podem ser alterados pelo usuário
//
// Para adicionar um novo filtro (ex.: marca), inclua o campo no
// formulário, leia-o em applyFilters() e aplique em filteredProducts.
// ─────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaListUl, FaTh } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import './Catalog.css';

// Número de produtos exibidos por página
const itemsPerPage = 12;

// Chave para persistir o modo de visualização (grade/lista) na sessão
const VIEW_STORAGE_KEY = 'catalogLayoutMode';

// ─── toNumberOrNull ───────────────────────────────────────────────
// Converte um valor para número ou null se inválido/vazio.
// Usado para tratar os parâmetros de preço mínimo/máximo da URL.
const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
};

// ─── normalizeText ────────────────────────────────────────────────
// Converte texto para minúsculas sem espaços extras para comparação
// case-insensitive na busca de produtos.
const normalizeText = (value) => String(value || '').toLowerCase().trim();

// Props recebidas (com valores padrão para uso no catálogo geral)
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
  // Página atual da paginação (começa em 1)
  const [currentPage, setCurrentPage] = useState(1);

  // Controla se o painel de filtros mobile está visível
  // Inicializa aberto em mobile quando há um termo de busca na URL
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const initialSearch = new URLSearchParams(window.location.search).get('q') || '';
    return window.innerWidth <= 1024 && Boolean(initialSearch.trim());
  });

  // searchParams permite ler e alterar os query params da URL (ex.: ?q=tênis&sort=price-asc)
  const [searchParams, setSearchParams] = useSearchParams();

  // Referência ao formulário de filtros para poder resetá-lo via filterFormRef.current.reset()
  const filterFormRef = useRef(null);

  // Modo de visualização: 'grid' (padrão) ou 'list'
  // Persiste no sessionStorage para manter a preferência ao navegar
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = sessionStorage.getItem(VIEW_STORAGE_KEY);
      return saved === 'list' || saved === 'grid' ? saved : 'grid';
    } catch {
      return 'grid'; // Fallback se sessionStorage não estiver disponível
    }
  });

  // Filtros forçados extraídos das props (não podem ser alterados pelo usuário)
  const forcedCategory = forcedFilters.category || '';
  const forcedMinPrice = toNumberOrNull(forcedFilters.minPrice);
  const forcedMaxPrice = toNumberOrNull(forcedFilters.maxPrice);

  // ─── Scroll para o topo ao montar ─────────────────────────────
  // Garante que a página sempre começa no topo ao ser carregada.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ─── Persiste modo de visualização ────────────────────────────
  // Salva no sessionStorage sempre que o usuário muda entre grade e lista.
  useEffect(() => {
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, viewMode);
    } catch {
      /* ignore: sessionStorage pode estar desabilitado */
    }
  }, [viewMode]);

  // ─── effectiveFilters ──────────────────────────────────────────
  // Consolida os filtros ativos combinando:
  //  1. Parâmetros da URL (precedência)
  //  2. Filtros iniciais das props (initialFilters)
  //  3. Filtros forçados das props (forcedFilters, sempre prioritários)
  // Recalculado apenas quando searchParams ou os filtros das props mudam.
  const effectiveFilters = useMemo(() => {
    const querySearch = searchParams.get('q') || initialFilters.q || '';
    const queryCategory = searchParams.get('category') || initialFilters.category || '';
    const queryMinPrice = searchParams.get('min') ?? initialFilters.minPrice ?? '';
    const queryMaxPrice = searchParams.get('max') ?? initialFilters.maxPrice ?? '';
    const querySort = searchParams.get('sort') || initialFilters.sortBy || 'relevance';

    return {
      q: querySearch,
      // forcedCategory sobrepõe qualquer seleção do usuário
      category: forcedCategory || queryCategory,
      minPrice: forcedMinPrice ?? toNumberOrNull(queryMinPrice),
      maxPrice: forcedMaxPrice ?? toNumberOrNull(queryMaxPrice),
      sortBy: querySort,
    };
  }, [searchParams, initialFilters, forcedCategory, forcedMinPrice, forcedMaxPrice]);

  // ─── filteredProducts ──────────────────────────────────────────
  // Aplica todos os filtros ativos sobre a lista de produtos e ordena.
  // Usa useMemo para evitar recalcular a cada render desnecessário.
  // Só recalcula quando `products` ou `effectiveFilters` mudam.
  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(effectiveFilters.q);
    const normalizedCategory = normalizeText(effectiveFilters.category);

    // Filtra por texto de busca, categoria e faixa de preço
    const results = products.filter((product) => {
      // Busca no nome, referência e categoria do produto
      const searchableText = `${product.name} ${product.ref} ${product.category}`;
      const hasSearchMatch = normalizedSearch ? normalizeText(searchableText).includes(normalizedSearch) : true;
      // Correspondência exata de categoria (case-insensitive)
      const hasCategoryMatch = normalizedCategory ? normalizeText(product.category) === normalizedCategory : true;
      // Filtro de preço mínimo
      const hasMinPriceMatch = effectiveFilters.minPrice !== null ? product.price >= effectiveFilters.minPrice : true;
      // Filtro de preço máximo
      const hasMaxPriceMatch = effectiveFilters.maxPrice !== null ? product.price <= effectiveFilters.maxPrice : true;

      return hasSearchMatch && hasCategoryMatch && hasMinPriceMatch && hasMaxPriceMatch;
    });

    // Aplicação da ordenação selecionada
    if (effectiveFilters.sortBy === 'price-asc') {
      return [...results].sort((a, b) => a.price - b.price);  // Menor preço primeiro
    }

    if (effectiveFilters.sortBy === 'price-desc') {
      return [...results].sort((a, b) => b.price - a.price);  // Maior preço primeiro
    }

    if (effectiveFilters.sortBy === 'name-asc') {
      return [...results].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')); // A-Z
    }

    // 'relevance': sem ordenação adicional (ordem original da API)
    return results;
  }, [products, effectiveFilters]);

  // ─── Cálculo de paginação ──────────────────────────────────────
  // Total de páginas com base nos produtos filtrados
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  // Protege contra currentPage maior que o total (ex.: após aplicar filtro restritivo)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const indexOfLastItem = safeCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Slice dos produtos para a página atual
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // ─── paginate ─────────────────────────────────────────────────
  // Navega para a página indicada e faz scroll suave para o topo.
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── applyFilters ─────────────────────────────────────────────
  // Lida com o submit do formulário de filtros.
  // Lê os valores do FormData, monta os query params e atualiza a URL.
  // Resetar para a página 1 evita exibir página vazia após filtro restritivo.
  const applyFilters = (event) => {
    event.preventDefault();

    const nextParams = new URLSearchParams();

    // Lê os valores diretamente do formulário via FormData (não de estado)
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') || '').trim();
    const category = String(formData.get('category') || '').trim();
    const min = String(formData.get('min') || '').trim();
    const max = String(formData.get('max') || '').trim();
    const sort = String(formData.get('sort') || '').trim();

    // Só inclui o param na URL se tiver valor (URLs mais limpas)
    if (q) nextParams.set('q', q);
    if (category) nextParams.set('category', category);
    if (min) nextParams.set('min', min);
    if (max) nextParams.set('max', max);
    if (sort && sort !== 'relevance') nextParams.set('sort', sort);

    // Atualiza a URL com os novos filtros e reseta para a primeira página
    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  // ─── clearFilters ─────────────────────────────────────────────
  // Limpa todos os filtros: reseta o formulário, limpa a URL e
  // volta para a primeira página.
  const clearFilters = () => {
    if (filterFormRef.current) {
      filterFormRef.current.reset(); // Limpa os campos do formulário visualmente
    }
    setSearchParams(new URLSearchParams()); // Remove todos os query params da URL
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(1);
  };

  // ─── getCardProps ─────────────────────────────────────────────
  // Retorna as props extras para o ProductCard com base no pageVariant:
  //  - 'promo': badge "Oferta" e preço antigo calculado (+16% do preço atual)
  //  - 'launch': badge "Novo"
  //  - demais: props padrão sem badge nem preço antigo
  const getCardProps = (product) => {
    if (pageVariant === 'promo') {
      return {
        variant: 'promo',
        badgeText: 'Oferta',
        oldPrice: Number((product.price * 1.16).toFixed(2)), // Simula desconto de ~14%
      };
    }

    if (pageVariant === 'launch') {
      return {
        variant: 'launch',
        badgeText: 'Novo',
      };
    }

    // Catálogo padrão: sem badge nem preço antigo
    return {
      variant: 'default',
      badgeText: '',
      oldPrice: null,
    };
  };

  return (
    // Classe dinâmica: page-catalog, page-launch ou page-promo (controla estilo do hero)
    <main className={`container catalog-page page-${pageVariant}`}>
      {/* ── Cabeçalho da página ── */}
      <header className="catalog-hero">
        <h1 className="catalog-title">{pageTitle}</h1>
        <p className="catalog-subtitle">{pageSubtitle}</p>
        {/* Contador: quantos produtos estão sendo exibidos vs. total filtrado */}
        <p className="catalog-subtitle">
          Exibindo {currentItems.length} de {filteredProducts.length} produto(s) filtrado(s)
        </p>
      </header>

      {/* Banner de aviso quando a API falha (usa dados locais como fallback) */}
      {productsError ? (
        <p className="catalog-banner catalog-banner--warn">{productsError}</p>
      ) : null}

      {/* Indicador de carregamento da API */}
      {isLoadingProducts && (
        <p className="catalog-subtitle">
          Carregando produtos...
        </p>
      )}

      {/* ── Layout principal: filtros laterais + grade de produtos ── */}
      <div className={`catalog-layout ${showFilters ? '' : 'no-filters'}`}>
        {/* Painel de filtros — exibido apenas quando showFilters=true */}
        {showFilters ? (
          <>
            {/* Botão que abre o painel de filtros em mobile */}
            <button
              type="button"
              className="filter-toggle-mobile"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              Filtrar resultados
            </button>

            {/* Painel lateral de filtros: fixo em desktop, drawer em mobile */}
            <aside className={`catalog-filters ${isMobileFilterOpen ? 'is-open' : ''}`}>
              {/* Cabeçalho do painel mobile com botão de fechar */}
              <div className="filters-header-mobile">
                <h3>Filtros</h3>
                <button type="button" onClick={() => setIsMobileFilterOpen(false)}>Fechar</button>
              </div>

              {/* Formulário de filtros: submit chama applyFilters */}
              <form ref={filterFormRef} onSubmit={applyFilters}>
                <h3 className="filters-title-desktop">Filtros</h3>

                {/* Campo de busca por nome ou referência */}
                <label htmlFor="search-input">Nome ou referência</label>
                <input
                  name="q"
                  id="search-input"
                  type="text"
                  defaultValue={effectiveFilters.q}
                  placeholder="Ex.: produto, REF-001"
                />

                {/* Seletor de categoria: desabilitado quando há forcedCategory */}
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

                {/* Faixa de preço: dois campos numéricos lado a lado */}
                <div className="price-range">
                  <div>
                    <label htmlFor="min-price">Preço mín.</label>
                    <input
                      name="min"
                      id="min-price"
                      type="number"
                      min="0"
                      defaultValue={forcedMinPrice ?? (effectiveFilters.minPrice ?? '')}
                      disabled={forcedMinPrice !== null} // Desabilitado se price mínimo é forçado
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
                      disabled={forcedMaxPrice !== null} // Desabilitado se price máximo é forçado
                      placeholder="5000"
                    />
                  </div>
                </div>

                {/* Seletor de ordenação dos resultados */}
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

                {/* Botão para aplicar os filtros selecionados */}
                <button type="submit" className="btn-gold filter-btn">Aplicar filtros</button>
                {/* Botão para limpar todos os filtros e voltar ao estado inicial */}
                <button type="button" className="clear-filter-btn" onClick={clearFilters}>Limpar</button>
              </form>
            </aside>

            {/* Overlay escuro para fechar o painel de filtros mobile ao clicar fora */}
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

        {/* ── Área de conteúdo principal: toolbar de visualização + grid de produtos ── */}
        <section className="catalog-content">
          {currentItems.length === 0 ? (
            // Estado vazio: exibido quando os filtros não retornam nenhum produto
            <div className="catalog-empty-state">
              <h3>Nenhum produto encontrado.</h3>
              <p>Tente ajustar os filtros para ampliar os resultados.</p>
            </div>
          ) : (
            <>
              {/* Barra de alternância entre visualização em grade e em lista */}
              <div className="catalog-view-toolbar">
                <span className="catalog-view-label">Visualização</span>
                <div className="catalog-view-toggle" role="group" aria-label="Modo de visualização">
                  {/* Botão grade */}
                  <button
                    type="button"
                    className={`catalog-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    title="Grade"
                  >
                    <FaTh aria-hidden />
                    Grade
                  </button>
                  {/* Botão lista */}
                  <button
                    type="button"
                    className={`catalog-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                    title="Lista"
                  >
                    <FaListUl aria-hidden />
                    Lista
                  </button>
                </div>
              </div>

              {/* Grade/lista de produtos da página atual */}
              <div
                className={`catalog-grid catalog-grid--${viewMode} ${
                  pageVariant === 'launch' ? 'catalog-grid-launch' : ''
                }`}
              >
                {currentItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    layout={viewMode}
                    // getCardProps define badge e oldPrice conforme o pageVariant
                    {...getCardProps(product)}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Controles de paginação (só exibidos quando há mais de uma página) ── */}
          {totalPages > 1 && (
            <div className="pagination">
              {/* Botão "Anterior": desabilitado na primeira página */}
              <button
                type="button"
                onClick={() => paginate(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="page-btn"
              >
                &laquo; Anterior
              </button>

              {/* Botões numerados para cada página */}
              {[...Array(totalPages)].map((_, index) => (
                <button
                  type="button"
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={`page-btn ${safeCurrentPage === index + 1 ? 'active' : ''}`}
                >
                  {index + 1}
                </button>
              ))}

              {/* Botão "Próxima": desabilitado na última página */}
              <button
                type="button"
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
