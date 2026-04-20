// ─────────────────────────────────────────────────────────────────
// Navbar.jsx — Barra de navegação principal da loja
//
// Renderiza o cabeçalho fixo no topo da página com:
//  - Logo e nome da loja (link para home)
//  - Barra de busca (desktop e mobile)
//  - Ações do usuário: link de login ou e-mail + botão de logout
//  - Botão do carrinho com badge de quantidade
//  - Links de navegação pelas categorias (parte inferior da navbar)
//
// Props:
//  - cartCount  (number): total de itens no carrinho (exibido no badge)
//  - onOpenCart (function): callback chamado ao clicar no ícone do carrinho
//
// Para adicionar novos links de categoria, insira mais <Link> dentro
// do <nav className="nav-links">.
// ─────────────────────────────────────────────────────────────────

import React from 'react';
import { FaBars, FaSearch, FaRegUser, FaShoppingCart, FaStore } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

// Props recebidas do App.jsx:
//  - cartCount: número total de unidades no carrinho
//  - onOpenCart: função para abrir o drawer lateral do carrinho
export default function Navbar({ cartCount, onOpenCart }) {
  // Lê o estado de autenticação do contexto global
  const { user, logout, isAuthenticated } = useAuth();

  // Texto digitado na barra de busca; atualizado via onChange
  const [searchTerm, setSearchTerm] = React.useState('');

  // useNavigate permite redirecionar programaticamente (ex.: ao submeter busca)
  const navigate = useNavigate();

  // ─── handleSearch ─────────────────────────────────────────────
  // Trata o submit do formulário de busca.
  // Se o campo estiver vazio, vai para /catalogo sem parâmetros.
  // Caso contrário, vai para /catalogo?q=<termo> para filtrar.
  const handleSearch = (event) => {
    event.preventDefault();
    const trimmedSearch = searchTerm.trim();

    if (!trimmedSearch) {
      // Sem termo: navega para o catálogo completo
      navigate('/catalogo');
      return;
    }

    // Com termo: navega para o catálogo com query param de busca
    navigate(`/catalogo?q=${encodeURIComponent(trimmedSearch)}`);
  };

  return (
    <header className="navbar">
      {/* ── Linha superior: logo + busca desktop + ações do usuário ── */}
      <div className="navbar-top container">
        <div className="navbar-main-row">

          {/* Wrapper do logo com botão de menu mobile */}
          <div className="logo-menu-wrapper">
            {/* Botão de menu hambúrguer — visível apenas em mobile via CSS */}
            <button type="button" className="mobile-menu-btn" aria-label="Menu">
              <FaBars />
            </button>

            {/* Logo: clique leva à home */}
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

          {/* Formulário de busca — visível apenas em desktop via CSS */}
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

          {/* Área de ações do usuário: login/logout + carrinho */}
          <div className="user-actions">
            <div className="login-register">
              {/* Exibe e-mail + botão Sair se autenticado, ou link "Minha conta" se não */}
              {isAuthenticated ? (
                <div className="user-session">
                  <span className="icon-user" aria-hidden>
                    <FaRegUser />
                  </span>
                  <Link to="/minha-conta" className="user-email" title={user.email}>
                    {user.email}
                  </Link>
                  <button type="button" className="btn-logout-nav" onClick={logout}>
                    Sair
                  </button>
                </div>
              ) : (
                // Usuário não autenticado: link para a página de login
                <Link to="/login" className="login-link-nav" aria-label="Entrar na conta">
                  <span className="icon-user" aria-hidden>
                    <FaRegUser />
                  </span>
                  <span className="login-text-nav">Minha conta</span>
                </Link>
              )}
            </div>

            {/* Botão do carrinho com badge de quantidade */}
            <button type="button" className="cart-btn" onClick={onOpenCart} aria-label="Abrir carrinho">
              <FaShoppingCart />
              {/* Badge de quantidade: só exibe se houver itens no carrinho */}
              {cartCount > 0 ? <span className="cart-count">{cartCount}</span> : null}
            </button>
          </div>
        </div>

        {/* Formulário de busca para mobile — exibido abaixo da linha principal */}
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

      {/* ── Linha inferior: links de categorias ── */}
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
