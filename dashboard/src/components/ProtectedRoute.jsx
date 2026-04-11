import React from 'react';
import { Navigate } from 'react-router-dom';

const mockUser = {
  nome: "Admin Supremo",
  email: "admin@pastractor.com",
  isMaster: true,
  permissoes: [
    "VER_FINANCEIRO",
    "MANIPULAR_PEDIDOS",
    "MANIPULAR_PRODUTOS",
    "VER_RELATORIOS"
  ]
};

export default function ProtectedRoute({ children, requiredPermission }) {
  const user = mockUser;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isMaster) {
    return children;
  }

  if (requiredPermission && !user.permissoes.includes(requiredPermission)) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <h1>Acesso Negado</h1>
        <p>Você não tem privilégios para acessar esta área.</p>
      </div>
    );
  }

  return children;
}