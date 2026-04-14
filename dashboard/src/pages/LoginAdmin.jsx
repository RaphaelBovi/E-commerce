import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginAdmin.css';
import logoImg from '../assets/pastractor-logo.png';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');
export const ADMIN_SESSION_KEY = 'dashboard_admin_session';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message || 'E-mail ou senha incorretos.');
        return;
      }

      const data = await response.json();

      if (data.role !== 'MASTER' && data.role !== 'ADMIN') {
        setError('Acesso negado. Apenas administradores podem acessar este painel.');
        return;
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        token: data.token,
        email: data.email,
        role: data.role,
      }));

      navigate('/');
    } catch (err) {
      console.error('Erro ao conectar com o servidor:', err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logoImg} alt="Pastractor Logo" className="login-logo" />
        <h2>Acesso ao <span className="highlight-text">Painel</span></h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>E-mail Corporativo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
