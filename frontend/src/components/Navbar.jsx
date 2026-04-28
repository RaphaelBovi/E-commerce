import React, { useRef, useState, useEffect } from 'react';
import { FaBars, FaSearch, FaRegUser, FaShoppingCart, FaStore } from 'react-icons/fa';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

const fmt = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Navbar({ cartCount, onOpenCart, products = [] }) {
  const { logout, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm]     = useState('');
  const [suggestions, setSuggestions]   = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate    = useNavigate();
  const searchRef   = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const q = val.trim().toLowerCase();
      const results = products
        .filter((p) =>
          p.name?.toLowerCase().includes(q) ||
          String(p.ref || '').toLowerCase().includes(q)
        )
        .slice(0, 6);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    }, 300);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    const q = searchTerm.trim();
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
    setSearchTerm('');
    setSuggestions([]);
  };

  const handleSuggestionClick = (product) => {
    setShowDropdown(false);
    setSearchTerm('');
    setSuggestions([]);
    navigate(`/produto/${product.id}`);
  };

  const thumbUrl = (p) => p.images?.[0] || p.image || '';
  const showPrice = (p) => (p.isPromo ? p.promotionalPrice : p.price);

  return (
    <header className="navbar">
      {/* ── Promo bar ── */}
      <div className="navbar-promo">
        <span>Frete grátis em compras acima de <strong>R$ 299</strong> · Parcele em até 6x sem juros</span>
      </div>

      {/* ── Linha superior ── */}
      <div className="navbar-top container">
        <div className="navbar-main-row">

          <div className="logo-menu-wrapper">
            <button type="button" className="mobile-menu-btn" aria-label="Menu">
              <FaBars />
            </button>
            <Link to="/" className="logo-container">
              <span className="logo-mark" aria-hidden>
                <FaStore />
              </span>
              <div className="logo-text-wrapper">
                <div className="logo-title">
                  Sua<span className="logo-accent">Loja</span>
                </div>
                <span className="logo-subtitle">template e-commerce</span>
              </div>
            </Link>
          </div>

          {/* Desktop search + autocomplete */}
          <div ref={searchRef} className="navbar-search desktop-search">
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="search"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                aria-label="Buscar na loja"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
              />
              <button type="submit" className="btn-search" aria-label="Buscar">
                <FaSearch />
              </button>
            </form>

            {showDropdown && (
              <ul className="search-dropdown" role="listbox" aria-label="Sugestões de busca">
                {suggestions.map((p) => (
                  <li
                    key={p.id}
                    className="search-suggestion-item"
                    role="option"
                    onMouseDown={() => handleSuggestionClick(p)}
                  >
                    <div className="search-sugg-img">
                      {thumbUrl(p)
                        ? <img src={thumbUrl(p)} alt="" loading="lazy" />
                        : <FaSearch />}
                    </div>
                    <div className="search-sugg-info">
                      <span className="search-sugg-name">{p.name}</span>
                      <span className="search-sugg-price">{fmt(showPrice(p))}</span>
                    </div>
                  </li>
                ))}
                {searchTerm.trim() && (
                  <li
                    className="search-suggestion-all"
                    onMouseDown={() => {
                      setShowDropdown(false);
                      navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`);
                      setSearchTerm('');
                    }}
                  >
                    Ver todos os resultados para "<strong>{searchTerm.trim()}</strong>"
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* User actions */}
          <div className="user-actions">
            <div className="login-register">
              {isAuthenticated ? (
                <Link to="/minha-conta" className="login-link-nav" aria-label="Minha conta">
                  <span className="icon-user" aria-hidden><FaRegUser /></span>
                  <span className="login-text-nav">Minha conta</span>
                </Link>
              ) : (
                <Link to="/login" className="login-link-nav" aria-label="Entrar na conta">
                  <span className="icon-user" aria-hidden><FaRegUser /></span>
                  <span className="login-text-nav">Minha conta</span>
                </Link>
              )}
            </div>
            <button type="button" className="cart-btn" onClick={onOpenCart} aria-label="Abrir carrinho">
              <FaShoppingCart />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Mobile search (form only, no dropdown) */}
        <form className="search-bar mobile-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Buscar na loja"
          />
          <button type="submit" className="btn-search" aria-label="Buscar">
            <FaSearch />
          </button>
        </form>
      </div>

      {/* ── Bottom nav ── */}
      <div className="navbar-bottom">
        <nav className="container nav-links" aria-label="Categorias principais">
          <NavLink to="/lancamentos" className={({ isActive }) => isActive ? 'nav-active' : ''}>Novidades</NavLink>
          <NavLink to="/catalogo"    className={({ isActive }) => isActive ? 'nav-active' : ''}>Catálogo</NavLink>
          <NavLink to="/promocoes"   className={({ isActive }) => isActive ? 'nav-active' : ''}>Ofertas</NavLink>
          <NavLink to="/institucional" className={({ isActive }) => isActive ? 'nav-active' : ''}>Sobre</NavLink>
        </nav>
      </div>
    </header>
  );
}
