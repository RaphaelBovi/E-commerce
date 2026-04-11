import React from 'react';
import { FaBars, FaSearch, FaRegUser, FaShoppingCart } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logoImg from '../assets/pastractor-logo.png';

export default function Navbar({ cartCount, onOpenCart }) {
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
            <button className="mobile-menu-btn">
              <FaBars />
            </button>
            <div className="logo-container">
              <Link to="/" className="logo-container" style={{ textDecoration: 'none', color: 'inherit' }}>
                <img src={logoImg} alt="Logo Pastractor" className="logo-img" />
                <div className="logo-text-wrapper">
                  <div className="logo-title">
                    <span className="highlight-text">PASTRACTOR</span>
                  </div>
                  <span className="logo-subtitle">DISTRIBUIDORA DE PEÇAS</span>
                </div>
              </Link>
            </div>

          </div>

          <form className="search-bar desktop-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Pesquisa em toda a loja..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button className="btn-search">
              <FaSearch />
            </button>
          </form>

          <div className="user-actions">
            <div className="login-register">
              <span className="icon-user">
                <FaRegUser />
              </span>
            </div>

            <button className="cart-btn" onClick={onOpenCart}>
              <FaShoppingCart />
              <span className="cart-count">{cartCount}</span>
            </button>
          </div>
        </div>

        <form className="search-bar mobile-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Pesquisa em toda a loja..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button className="btn-search">
            <FaSearch />
          </button>
        </form>
      </div>

      <div className="navbar-bottom">
        <div className="container nav-links">
          <Link to="/lancamentos">Lançamentos</Link>
          <Link to="/catalogo">Peças</Link>
          <Link to="/promocoes">Promoções</Link>
          <Link to="/institucional">Institucional</Link>
        </div>
      </div>
    </header>
  );
}