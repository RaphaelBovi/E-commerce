// ─────────────────────────────────────────────────────────────────
// ProtectedRoute.jsx — Componente de proteção de rotas
//
// Verifica se o usuário possui uma sessão administrativa válida
// antes de renderizar qualquer página protegida.
//
// Comportamento:
//   - Sem sessão válida → redireciona para /login, preservando a URL
//     original em `state.from` para possível redirecionamento pós-login.
//   - masterOnly=true e role !== "MASTER" → exibe mensagem de acesso restrito
//     sem redirecionar (o usuário continua logado, mas sem permissão).
//   - Sessão válida e permissão OK → renderiza {children} normalmente.
//
// Nota: este componente é standalone (sem AdminLayout embutido).
// O layout principal é aplicado pelo App.jsx ao envolver este componente.
//
// Para adicionar um novo nível de permissão (ex: SUPERVISOR),
// inclua uma nova prop (ex: supervisorOnly) e adicione a verificação abaixo.
// ─────────────────────────────────────────────────────────────────

import { Navigate, useLocation } from "react-router-dom";

// Lê e valida a sessão administrativa do sessionStorage.
// Retorna o objeto de sessão { token, email, role } se válido, ou null.
// A validação exige que token e email estejam presentes.
function getSession() {
  try {
    const raw = sessionStorage.getItem("dashboard_admin_session");
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Garante que os campos essenciais existem antes de considerar válida
    return s?.token && s?.email ? s : null;
  } catch {
    // JSON corrompido ou outro erro inesperado
    return null;
  }
}

// Props:
//   children    → Componente(s) filho(s) a renderizar quando autenticado
//   masterOnly  → (default: false) Se true, exige role === "MASTER"
export default function ProtectedRoute({ children, masterOnly = false }) {
  const session = getSession();
  const location = useLocation(); // URL atual, salva para redirecionamento pós-login

  // Sem sessão válida: redireciona para /login.
  // O state { from: location } permite que a tela de login redirecione
  // o usuário de volta para a página que ele tentou acessar.
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rota exclusiva para MASTER, mas usuário tem apenas ADMIN.
  // Exibe mensagem amigável sem redirecionar.
  if (masterOnly && session.role !== "MASTER") {
    return (
      <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-secondary)" }}>
        <h2 style={{ marginBottom: "0.5rem", color: "var(--text)" }}>Acesso Restrito</h2>
        <p>Esta área é exclusiva para administradores MASTER.</p>
      </div>
    );
  }

  // Usuário autenticado e com permissão: renderiza o conteúdo protegido
  return children;
}
