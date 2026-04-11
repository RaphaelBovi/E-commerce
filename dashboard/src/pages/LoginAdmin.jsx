import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginAdmin.css';
import logoImg from '../assets/pastractor-logo.png';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterCode, setMasterCode] = useState('');
  const [isMasterAttempt, setIsMasterAttempt] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (email === 'master@pastractor.com' && password === 'admin123') {
        if (!isMasterAttempt) {
          setIsMasterAttempt(true);
          return;
        }

        if (masterCode === import.meta.env.VITE_MASTER_CODE) {
          localStorage.setItem('adminUser', JSON.stringify({
            nome: "Admin Master Supremo",
            email: email,
            role: 'MASTER',
            permissoes: ['ALL']
          }));
          navigate('/');
        } else {
          setError('Código Master Inválido!');
        }
      } else if (email === 'estoque@pastractor.com' && password === '123') {
        localStorage.setItem('adminUser', JSON.stringify({
          nome: "João (Estoque)",
          email: email,
          role: 'FUNCIONARIO',
          permissoes: ['MANIPULAR_PEDIDOS']
        }));
        navigate('/');
      } else {
        setError('Credenciais inválidas.');
      }
    } catch (err) {
      console.error("Erro na tentativa de login:", err);
      setError('Erro ao conectar com o servidor.');
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
              disabled={isMasterAttempt}
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isMasterAttempt}
            />
          </div>

          {isMasterAttempt && (
            <div className="input-group master-code-group">
              <label>Código de Segurança (MASTER)</label>
              <input
                type="password"
                required
                value={masterCode}
                onChange={(e) => setMasterCode(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <button type="submit" className="btn-login">
            {isMasterAttempt ? 'Validar Acesso Master' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}