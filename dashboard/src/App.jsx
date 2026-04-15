import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminNavbar from "./components/AdminNavbar";
import DashboardHome from "./pages/DashboardHome";
import LoginAdmin from "./pages/LoginAdmin";
import { ADMIN_SESSION_KEY } from "./pages/LoginAdmin";
import UsuariosAdmin from "./pages/UsuariosAdmin";
import GestaoPedidos from "./pages/GestaoPedidos";
import GestaoProdutos from "./pages/GestaoProdutos";
import NotasFiscais from "./pages/NotasFiscais";

function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-main">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children, masterOnly = false }) {
  const session = getAdminSession();
  if (!session) return <Navigate to="/login" replace />;

  if (masterOnly && session.role !== "MASTER") {
    return (
      <AdminLayout>
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <h2 style={{ color: "var(--text)" }}>Acesso Negado</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Apenas o MASTER pode acessar esta área.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginAdmin />} />
        <Route
          path="/"
          element={<ProtectedRoute><DashboardHome /></ProtectedRoute>}
        />
        <Route
          path="/pedidos"
          element={<ProtectedRoute><GestaoPedidos /></ProtectedRoute>}
        />
        <Route
          path="/produtos"
          element={<ProtectedRoute><GestaoProdutos /></ProtectedRoute>}
        />
        <Route
          path="/notas"
          element={<ProtectedRoute><NotasFiscais /></ProtectedRoute>}
        />
        <Route
          path="/usuarios"
          element={<ProtectedRoute masterOnly><UsuariosAdmin /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
