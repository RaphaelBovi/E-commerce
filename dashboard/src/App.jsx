import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardHome from './pages/DashboardHome';
import LoginAdmin from './pages/LoginAdmin';
import UsuariosAdmin from './pages/UsuariosAdmin';
import GestaoPedidos from './pages/GestaoPedidos';
import GestaoProdutos from './pages/GestaoProdutos';

const ProtectedRoute = ({ children, requiresMaster, requiresPermission }) => {
  const userString = localStorage.getItem('adminUser');
  if (!userString) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userString);
  if (requiresMaster && user.role !== 'MASTER') {
    return <div style={{padding: '3rem', textAlign: 'center'}}><h2>Acesso Negado. Apenas o MASTER pode acessar esta área.</h2></div>;
  }

  const hasPermission =
    user.role === 'MASTER' ||
    !requiresPermission ||
    (Array.isArray(user.permissoes) && user.permissoes.includes(requiresPermission));
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