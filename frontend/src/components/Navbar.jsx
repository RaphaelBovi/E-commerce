import React from 'react';
import { FaBars, FaSearch, FaRegUser, FaShoppingCart, FaStore } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

export default function Navbar({ cartCount, onOpenCart }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmedSearch = searchTerm.trim();

    if (!trimmedSearch) {
      navigate('/catalogo');
      return;
    }

    navigate(`/catalogo?q=${encodeURIComponent(trimmedSearch)}`);
  };

  return (
    <header className="navbar">
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
                  Sua <span className="highlight-text">Loja</span>
                </div>
                <span className="logo-subtitle">template e-commerce</span>
              </div>
            </Link>
          </div>

          <form className="search-bar desktop-search" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Buscar na loja"
            />
            <button type="submit" className="btn-search" aria-label="Buscar">
              <FaSearch />
            </button>
          </form>

          <div className="user-actions">
            <div className="login-register">
              {isAuthenticated ? (
                <div className="user-session">
                  <span className="icon-user" aria-hidden>
                    <FaRegUser />
                  </span>
                  <span className="user-email" title={user.email}>
                    {user.email}
                  </span>
                  <button type="button" className="btn-logout-nav" onClick={logout}>
                    Sair
                  </button>
                </div>
              ) : (
                <Link to="/login" className="login-link-nav" aria-label="Entrar na conta">
                  <span className="icon-user" aria-hidden>
                    <FaRegUser />
                  </span>
                  <span className="login-text-nav">Minha conta</span>
                </Link>
              )}
            </div>

            <button type="button" className="cart-btn" onClick={onOpenCart} aria-label="Abrir carrinho">
              <FaShoppingCart />
              {cartCount > 0 ? <span className="cart-count">{cartCount}</span> : null}
            </button>
          </div>
        </div>

        <form className="search-bar mobile-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Buscar na loja"
          />
          <button type="submit" className="btn-search" aria-label="Buscar">
            <FaSearch />
          </button>
        </form>
      </div>

      <div className="navbar-bottom">
        <nav className="container nav-links" aria-label="Categorias principais">
          <Link to="/lancamentos">Novidades</Link>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/promocoes">Ofertas</Link>
          <Link to="/institucional">Sobre</Link>
        </nav>
      </div>
    </header>
  );
}
