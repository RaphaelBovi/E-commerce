import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStore } from "react-icons/fa";
import "./LoginAdmin.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");
export const ADMIN_SESSION_KEY = "dashboard_admin_session";

export default function LoginAdmin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message || "E-mail ou senha incorretos.");
        return;
      }

      const data = await response.json();

      if (data.role !== "MASTER" && data.role !== "ADMIN") {
        setError("Acesso negado. Apenas administradores podem acessar este painel.");
        return;
      }

      sessionStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ token: data.token, email: data.email, role: data.role })
      );

      navigate("/");
    } catch {
      setError("Erro ao conectar com o servidor. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-icon">
          <FaStore />
        </div>
        <h1 className="login-title">Painel <span>Administrativo</span></h1>
        <p className="login-sub">Acesso restrito a administradores.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="admin-email">E-mail</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <label htmlFor="admin-password">Senha</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
