import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBars, FaTimes, FaStore, FaChartBar, FaBoxOpen,
  FaClipboardList, FaFileInvoice, FaUsers, FaSignOutAlt,
} from "react-icons/fa";
import "./AdminNavbar.css";

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("dashboard_admin_session") || "null");
  } catch {
    return null;
  }
}

const NAV_ITEMS = [
  { to: "/",         icon: <FaChartBar />,      label: "Dashboard" },
  { to: "/pedidos",  icon: <FaClipboardList />,  label: "Pedidos" },
  { to: "/produtos", icon: <FaBoxOpen />,         label: "Produtos" },
  { to: "/notas",    icon: <FaFileInvoice />,     label: "Notas Fiscais" },
];

const ADMIN_ITEMS = [
  { to: "/usuarios", icon: <FaUsers />, label: "Usuários" },
];

export default function AdminNavbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();

  const initials = session?.email
    ? session.email.slice(0, 2).toUpperCase()
    : "A";

  const handleLogout = () => {
    sessionStorage.removeItem("dashboard_admin_session");
    navigate("/login");
  };

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <>
      {/* Toggle mobile */}
      <button className="sidebar-toggle" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <FaBars />
      </button>

      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><FaStore /></div>
          <div>
            <div className="sidebar-logo-title">Admin Panel</div>
            <div className="sidebar-logo-sub">E-commerce</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "none" }}
            className="sidebar-close-btn"
            aria-label="Fechar menu"
          >
            <FaTimes />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Menu</span>
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

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-email">{session?.email || "—"}</div>
              <div className="sidebar-user-role">{session?.role || "ADMIN"}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}
