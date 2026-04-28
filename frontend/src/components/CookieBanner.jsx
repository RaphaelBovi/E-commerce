import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initAnalytics } from '../services/analytics';
import './CookieBanner.css';

const CONSENT_KEY = 'cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(CONSENT_KEY, 'accepted'); } catch { /* ignore */ }
    initAnalytics();
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem(CONSENT_KEY, 'declined'); } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de cookies">
      <p className="cookie-text">
        Usamos cookies para melhorar sua experiência de navegação. Ao continuar, você concorda com nossa{' '}
        <Link to="/politica-de-privacidade" className="cookie-link">Política de Privacidade</Link>.
      </p>
      <div className="cookie-actions">
        <button className="cookie-btn cookie-btn--decline" onClick={decline}>Recusar</button>
        <button className="cookie-btn cookie-btn--accept" onClick={accept}>Aceitar</button>
      </div>
    </div>
  );
}
