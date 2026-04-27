// ─────────────────────────────────────────────────────────────────
// AdminNavbar.jsx — Barra lateral de navegação do painel administrativo
//
// Renderiza a sidebar fixa com:
//   - Logo / identidade do painel
//   - Links de navegação (Dashboard, Pedidos, Produtos, Notas Fiscais)
//   - Seção de administração visível apenas para usuários MASTER (Usuários)
//   - Rodapé com e-mail e papel do usuário logado + botão de logout
//   - Suporte a dispositivos móveis: botão hambúrguer abre/fecha a sidebar
//     com sobreposição escura (overlay)
//
// Para adicionar um novo item de menu:
//   1. Adicione um objeto { to, icon, label } ao array NAV_ITEMS (ou ADMIN_ITEMS
//      se for exclusivo para MASTER).
//   2. O item aparecerá automaticamente na navegação.
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBars, FaTimes, FaStore, FaChartBar, FaBoxOpen,
  FaClipboardList, FaFileInvoice, FaUsers, FaSignOutAlt, FaHeadset, FaTag, FaStar, FaListUl, FaChartLine, FaImage, FaUndoAlt,
} from "react-icons/fa";
import "./AdminNavbar.css";

// Lê a sessão do administrador salva no sessionStorage.
// Retorna o objeto { token, email, role } ou null se não houver sessão.
// Usada para exibir o e-mail/papel do usuário no rodapé e para controlar
// a visibilidade do menu de administração.
function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("dashboard_admin_session") || "null");
  } catch {
    return null;
  }
}

// Itens do menu principal — visíveis para todos os administradores autenticados.
// Cada objeto define: rota de destino (to), ícone React Icons (icon) e rótulo (label).
// Para adicionar uma nova página ao menu, insira um item aqui.
const NAV_ITEMS = [
  { to: "/",           icon: <FaChartBar />,      label: "Dashboard"    },
  { to: "/relatorios", icon: <FaChartLine />,     label: "Relatórios"   },
  { to: "/pedidos",    icon: <FaClipboardList />, label: "Pedidos"      },
  { to: "/produtos",   icon: <FaBoxOpen />,       label: "Produtos"     },
  { to: "/notas",      icon: <FaFileInvoice />,   label: "Notas Fiscais" },
  { to: "/tickets",    icon: <FaHeadset />,       label: "Suporte"      },
  { to: "/banners",    icon: <FaImage />,         label: "Banners"      },
  { to: "/devolucoes", icon: <FaUndoAlt />,      label: "Devoluções"   },
];

// Itens do menu de administração — visíveis apenas para usuários com role "MASTER".
// Exibidos em uma seção separada abaixo dos itens principais.
const ADMIN_ITEMS = [
  { to: "/usuarios",   icon: <FaUsers />,   label: "Usuários" },
  { to: "/categorias", icon: <FaListUl />,  label: "Categorias" },
  { to: "/cupons",     icon: <FaTag />,     label: "Cupons" },
  { to: "/avaliacoes", icon: <FaStar />,    label: "Avaliações" },
];

export default function AdminNavbar() {
  // Controla se a sidebar está aberta no modo mobile (true = visível, false = oculta)
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();   // Permite navegar entre rotas programaticamente
  const location = useLocation();   // Fornece o pathname atual para destacar o item ativo
  const session = getSession();     // Dados da sessão do admin logado

  // Gera as iniciais do e-mail para exibir no avatar circular do rodapé.
  // Ex: "admin@empresa.com" → "AD"
  const initials = session?.email
    ? session.email.slice(0, 2).toUpperCase()
    : "A";

  // Remove a sessão do sessionStorage e redireciona para a tela de login.
  // Chamada quando o usuário clica em "Sair".
  const handleLogout = () => {
    sessionStorage.removeItem("dashboard_admin_session");
    navigate("/login");
  };

  // Verifica se um item de menu está ativo com base na URL atual.
  // A rota "/" usa comparação exata para não ficar sempre ativa.
  // As demais rotas usam startsWith para marcar sub-rotas como ativas também.
  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <>
      {/* Botão hambúrguer — visível apenas em telas mobile (≤768px).
          Abre a sidebar ao ser clicado. */}
      <button className="sidebar-toggle" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <FaBars />
      </button>

      {/* Overlay escuro por trás da sidebar em mobile.
          Clicar nele fecha a sidebar. */}
      <div
        className={`sidebar-overlay ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar principal — em desktop é sempre visível;
          em mobile desliza para dentro/fora com a classe "is-open" */}
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>

        {/* Seção do logo / identidade do painel */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><FaStore /></div>
          <div>
            <div className="sidebar-logo-title">Admin Panel</div>
            <div className="sidebar-logo-sub">E-commerce</div>
          </div>
          {/* Botão de fechar — visível apenas em mobile via CSS */}
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "none" }}
            className="sidebar-close-btn"
            aria-label="Fechar menu"
          >
            <FaTimes />
          </button>
        </div>

        {/* Área de navegação principal */}
        <nav className="sidebar-nav">
          {/* Rótulo da seção principal */}
          <span className="sidebar-nav-label">Menu</span>

          {/* Renderiza os itens principais de navegação.
              O item ativo recebe a classe "active" para destaque visual. */}
          {NAV_ITEMS.map((item) => (
            <button
              key={item.to}
              className={`sidebar-nav-item ${isActive(item.to) ? "active" : ""}`}
              onClick={() => { navigate(item.to); setOpen(false); }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* Seção de administração — renderizada somente para usuários MASTER.
              Para conceder acesso a um ADMIN específico, altere o role no backend. */}
          {session?.role === "MASTER" && (
            <>
              <span className="sidebar-nav-label">Administração</span>
              {ADMIN_ITEMS.map((item) => (
                <button
                  key={item.to}
                  className={`sidebar-nav-item ${isActive(item.to) ? "active" : ""}`}
                  onClick={() => { navigate(item.to); setOpen(false); }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Rodapé da sidebar: avatar, e-mail, papel e botão de logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {/* Avatar circular com as iniciais do e-mail */}
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              {/* E-mail do administrador logado */}
              <div className="sidebar-user-email">{session?.email || "—"}</div>
              {/* Papel do usuário: MASTER ou ADMIN */}
              <div className="sidebar-user-role">{session?.role || "ADMIN"}</div>
            </div>
          </div>
          {/* Botão de sair — remove sessão e vai para /login */}
          <button className="btn-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}
