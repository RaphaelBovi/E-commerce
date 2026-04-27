import { Link } from 'react-router-dom';
import { FaSearch, FaHome, FaBoxOpen } from 'react-icons/fa';
import { useSEO } from '../hooks/useSEO';
import './NotFound.css';

export default function NotFound() {
  useSEO({ title: 'Página não encontrada', noindex: true });

  return (
    <main className="nf-main">
      <div className="nf-container">
        <div className="nf-code">404</div>
        <div className="nf-icon"><FaSearch /></div>
        <h1 className="nf-title">Página não encontrada</h1>
        <p className="nf-desc">
          A página que você está procurando não existe ou foi movida.
          Verifique o endereço ou explore o site abaixo.
        </p>
        <div className="nf-actions">
          <Link to="/" className="nf-btn nf-btn--primary">
            <FaHome /> Ir para a Home
          </Link>
          <Link to="/catalogo" className="nf-btn nf-btn--ghost">
            <FaBoxOpen /> Ver catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}
