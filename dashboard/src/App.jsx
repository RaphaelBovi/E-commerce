import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardHome from './pages/DashboardHome';
import LoginAdmin from './pages/LoginAdmin';
import { ADMIN_SESSION_KEY } from './pages/LoginAdmin';
import UsuariosAdmin from './pages/UsuariosAdmin';
import GestaoPedidos from './pages/GestaoPedidos';
import GestaoProdutos from './pages/GestaoProdutos';

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

const ProtectedRoute = ({ children, requiresMaster, requiresPermission }) => {
  const session = getAdminSession();
  if (!session) return <Navigate to="/login" replace />;

  if (requiresMaster && session.role !== 'MASTER') {
    return <div style={{ padding: '3rem', textAlign: 'center' }}><h2>Acesso Negado. Apenas o MASTER pode acessar esta área.</h2></div>;
  }

  const isMaster = session.role === 'MASTER';
  const hasPermission =
    isMaster ||
    !requiresPermission ||
    (session.role === 'ADMIN' && requiresPermission === 'MANIPULAR_PRODUTOS');

  if (!hasPermission) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}><h2>Acesso Negado. Você não possui permissão para acessar esta área.</h2></div>;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginAdmin />} />
        <Route path="/" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
        <Route path="/pedidos" element={<ProtectedRoute><GestaoPedidos /></ProtectedRoute>} />
        <Route path="/produtos" element={
          <ProtectedRoute requiresPermission="MANIPULAR_PRODUTOS">
            <GestaoProdutos />
          </ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute requiresMaster={true}>
            <UsuariosAdmin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
