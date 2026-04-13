import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaStore } from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err?.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-page-box">
        <div className="login-page-mark" aria-hidden>
          <FaStore />
        </div>
        <h1>
          Acessar <span className="highlight-text">conta</span>
        </h1>
        <p className="login-page-sub">Entre com e-mail e senha cadastrados na API da loja.</p>

        {error ? <div className="login-page-error">{error}</div> : null}

        <form className="login-page-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="input-group">
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            className="btn-gold btn-login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <Link to="/" className="login-page-back">
          Voltar à loja
        </Link>
      </div>
    </main>
  );
}
