import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaUserCircle, FaTimes, FaBox, FaChartLine, FaUsers, FaSignOutAlt, FaBoxes } from 'react-icons/fa';
import './AdminNavbar.css';
import logoImg from '../assets/pastractor-logo.png';



export default function AdminNavbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [currentUser] = useState(() => {
    const userString = localStorage.getItem('adminUser');
    return userString ? JSON.parse(userString) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const canManageProducts =
    currentUser?.role === 'MASTER' || currentUser?.permissoes?.includes('MANIPULAR_PRODUTOS');

  return (
    <>
      <header className="navbar">
        <div className="navbar-top container">
          <div className="navbar-main-row">

            <div className="logo-menu-wrapper">
              <Link to="/" className="logo-container" style={{ textDecoration: 'none', color: 'inherit' }}>
                <img src={logoImg} alt="Logo Pastractor" className="logo-img" />
                <div className="logo-text-wrapper">
                  <div className="logo-title"><span className="highlight-text">PASTRACTOR</span></div>
                  <span className="logo-subtitle">DISTRIBUIDORA DE PEÇAS</span>
                </div>
              </Link>
            </div>

            <div className="admin-nav-right">

              <div className="admin-user-info" onClick={() => setIsSidebarOpen(true)}>
                <FaUserCircle className="admin-avatar-icon" />
                <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                  <FaBars />
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <FaUserCircle className="sidebar-avatar" />
          <div className="sidebar-user-details">
            <h4>{currentUser?.nome}</h4>
            <span className={`role-badge ${currentUser?.role === 'MASTER' ? 'role-master' : ''}`}>
              {currentUser?.role || 'USUÁRIO'}
            </span>
          </div>
          <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}><FaTimes /></button>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            <FaChartLine /> Dashboard Geral
          </Link>
          <Link to="/pedidos" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            <FaBox /> Gestão de Pedidos
          </Link>
          {canManageProducts && (
            <Link to="/produtos" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>
              <FaBoxes /> Gestão de Produtos
            </Link>
          )}

          {currentUser?.role === 'MASTER' && (
            <div className="sidebar-master-section">
              <div className="sidebar-divider">Área do Administrador</div>
              <Link to="/usuarios" className="sidebar-link master-link" onClick={() => setIsSidebarOpen(false)}>
                <FaUsers /> Gerenciar Funcionários
              </Link>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}><FaSignOutAlt /> Sair do Sistema</button>
        </div>
      </div>
    </>
  );
}