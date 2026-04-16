// ─────────────────────────────────────────────────────────────────
// LoginAdmin.jsx — Tela de login do painel administrativo
//
// Responsabilidades:
//   - Exibir o formulário de autenticação (e-mail + senha)
//   - Enviar as credenciais à API via POST /auth/login
//   - Verificar se o usuário retornado tem role ADMIN ou MASTER
//   - Salvar a sessão no sessionStorage e redirecionar para "/"
//   - Exibir mensagens de erro amigáveis em caso de falha
//
// A URL base da API é lida da variável de ambiente VITE_API_BASE_URL.
// Se não definida, usa "http://localhost:8080/api" como padrão.
//
// ADMIN_SESSION_KEY é exportado para que App.jsx e outros componentes
// acessem/removam a sessão com a mesma chave.
//
// Para testar localmente sem backend, altere handleLogin para simular
// uma resposta de sucesso diretamente.
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStore } from "react-icons/fa";
import "./LoginAdmin.css";

// URL base da API — lida do ambiente (.env) e sem barra no final.
// Exemplo de .env: VITE_API_BASE_URL=https://api.seusite.com/api
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

// Chave usada para salvar/ler a sessão no sessionStorage.
// Exportada para ser reutilizada em App.jsx, AdminNavbar.jsx e ProtectedRoute.jsx.
export const ADMIN_SESSION_KEY = "dashboard_admin_session";

export default function LoginAdmin() {
  // Estado do campo de e-mail digitado pelo usuário
  const [email, setEmail]       = useState("");

  // Estado do campo de senha digitada pelo usuário
  const [password, setPassword] = useState("");

  // Mensagem de erro exibida ao usuário (string vazia = sem erro)
  const [error, setError]       = useState("");

  // Indica se a requisição de login está em andamento (para desabilitar o botão)
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate(); // Permite redirecionar após login bem-sucedido

  // Realiza o login:
  //   1. Envia e-mail e senha para a API via POST
  //   2. Valida a resposta (status HTTP e role do usuário)
  //   3. Salva a sessão no sessionStorage
  //   4. Redireciona para o dashboard "/"
  // Em caso de erro, exibe mensagem adequada ao usuário.
  const handleLogin = async (e) => {
    e.preventDefault();  // Impede recarregamento da página pelo form
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      // Resposta HTTP com erro (4xx/5xx)
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message || "E-mail ou senha incorretos.");
        return;
      }

      const data = await response.json();

      // Apenas MASTER e ADMIN podem acessar o painel.
      // Clientes comuns da loja são bloqueados aqui.
      if (data.role !== "MASTER" && data.role !== "ADMIN") {
        setError("Acesso negado. Apenas administradores podem acessar este painel.");
        return;
      }

      // Persiste a sessão no sessionStorage (dura até fechar a aba/janela).
      // Para sessão permanente, use localStorage (mas considere os riscos de segurança).
      sessionStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ token: data.token, email: data.email, role: data.role })
      );

      // Redireciona para o dashboard principal após login bem-sucedido
      navigate("/");
    } catch {
      // Erro de rede ou servidor indisponível
      setError("Erro ao conectar com o servidor. Verifique sua conexão.");
    } finally {
      // Sempre reativa o botão de login ao finalizar, com sucesso ou erro
      setLoading(false);
    }
  };

  return (
    // Tela de fundo centralizada que preenche toda a viewport
    <div className="login-page">
      {/* Caixa de login centralizada com sombra e borda */}
      <div className="login-box">
        {/* Ícone de loja como identidade visual do painel */}
        <div className="login-icon">
          <FaStore />
        </div>

        {/* Título e subtítulo da tela */}
        <h1 className="login-title">Painel <span>Administrativo</span></h1>
        <p className="login-sub">Acesso restrito a administradores.</p>

        {/* Mensagem de erro — renderizada somente se houver erro */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Formulário de login — dispara handleLogin ao submeter */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Campo de e-mail */}
          <div className="input-group">
            <label htmlFor="admin-email">E-mail</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}  // Desabilita durante o envio
            />
          </div>

          {/* Campo de senha */}
          <div className="input-group">
            <label htmlFor="admin-password">Senha</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}  // Desabilita durante o envio
            />
          </div>

          {/* Botão de submit — mostra "Entrando…" enquanto aguarda a API */}
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
