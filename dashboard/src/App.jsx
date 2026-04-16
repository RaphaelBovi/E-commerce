// ─────────────────────────────────────────────────────────────────
// App.jsx — Roteador raiz do painel administrativo
//
// Define todas as rotas da aplicação usando React Router v6.
// Implementa proteção de rotas via <ProtectedRoute>, que verifica
// se há uma sessão administrativa válida no sessionStorage.
// O layout principal (sidebar + conteúdo) é aplicado via <AdminLayout>
// a todas as rotas protegidas.
//
// Rotas disponíveis:
//   /login      → Tela de login (pública)
//   /           → Dashboard com resumo geral (protegida)
//   /pedidos    → Gestão de pedidos (protegida)
//   /produtos   → Gestão de produtos (protegida)
//   /notas      → Notas fiscais (protegida)
//   /usuarios   → Usuários admin (protegida, apenas MASTER)
//   *           → Qualquer rota inválida redireciona para "/"
//
// Para adicionar uma nova página:
//   1. Crie o componente em src/pages/
//   2. Importe-o aqui
//   3. Adicione uma nova <Route> dentro de <Routes>
// ─────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminNavbar from "./components/AdminNavbar";
import DashboardHome from "./pages/DashboardHome";
import LoginAdmin from "./pages/LoginAdmin";
import { ADMIN_SESSION_KEY } from "./pages/LoginAdmin";
import UsuariosAdmin from "./pages/UsuariosAdmin";
import GestaoPedidos from "./pages/GestaoPedidos";
import GestaoProdutos from "./pages/GestaoProdutos";
import NotasFiscais from "./pages/NotasFiscais";

// Lê e valida a sessão administrativa salva no sessionStorage.
// Retorna o objeto { token, email, role } se válido, ou null caso contrário.
// É usada antes de cada renderização de rota protegida para garantir
// que apenas administradores autenticados acessem o conteúdo.
function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Verifica que os três campos obrigatórios existem na sessão
    if (!parsed?.token || !parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    // JSON inválido ou outro erro — trata como sessão ausente
    return null;
  }
}

// Layout padrão do painel: sidebar (AdminNavbar) à esquerda + área de conteúdo à direita.
// Todas as páginas protegidas são renderizadas como filhas ({children}) desta estrutura.
// Para alterar o layout global (ex: adicionar header fixo), edite aqui.
function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      {/* Barra lateral de navegação fixa */}
      <AdminNavbar />
      {/* Área principal onde cada página é renderizada */}
      <main className="admin-main">{children}</main>
    </div>
  );
}

// Guarda de rota que protege páginas que exigem autenticação.
// Props:
//   children    → Componente da página a ser exibido se autorizado
//   masterOnly  → Se true, apenas usuários com role "MASTER" podem acessar
//
// Comportamento:
//   - Sem sessão válida → redireciona para /login
//   - masterOnly=true e role !== "MASTER" → exibe mensagem "Acesso Negado"
//   - Caso contrário → renderiza a página dentro do AdminLayout
function ProtectedRoute({ children, masterOnly = false }) {
  const session = getAdminSession();

  // Sem sessão: redireciona para login (replace evita voltar no histórico)
  if (!session) return <Navigate to="/login" replace />;

  // Rota exclusiva para MASTER, mas usuário é apenas ADMIN
  if (masterOnly && session.role !== "MASTER") {
    return (
      <AdminLayout>
        {/* Mensagem de acesso negado renderizada dentro do layout normal */}
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <h2 style={{ color: "var(--text)" }}>Acesso Negado</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Apenas o MASTER pode acessar esta área.
          </p>
        </div>
      </AdminLayout>
    );
  }

  // Usuário autenticado e com permissão: renderiza a página dentro do layout
  return <AdminLayout>{children}</AdminLayout>;
}

// Componente raiz da aplicação.
// Envolve tudo em <BrowserRouter> para habilitar o roteamento baseado em URL.
// Cada <Route> mapeia um caminho de URL para um componente de página.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública — não requer autenticação */}
        <Route path="/login" element={<LoginAdmin />} />

        {/* Rota protegida — Dashboard principal */}
        <Route
          path="/"
          element={<ProtectedRoute><DashboardHome /></ProtectedRoute>}
        />

        {/* Rota protegida — Lista e gerenciamento de pedidos */}
        <Route
          path="/pedidos"
          element={<ProtectedRoute><GestaoPedidos /></ProtectedRoute>}
        />

        {/* Rota protegida — Cadastro e edição de produtos */}
        <Route
          path="/produtos"
          element={<ProtectedRoute><GestaoProdutos /></ProtectedRoute>}
        />

        {/* Rota protegida — Notas fiscais de pedidos entregues */}
        <Route
          path="/notas"
          element={<ProtectedRoute><NotasFiscais /></ProtectedRoute>}
        />

        {/* Rota protegida e exclusiva para MASTER — Gestão de admins */}
        <Route
          path="/usuarios"
          element={<ProtectedRoute masterOnly><UsuariosAdmin /></ProtectedRoute>}
        />

        {/* Qualquer rota não mapeada redireciona para o dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
