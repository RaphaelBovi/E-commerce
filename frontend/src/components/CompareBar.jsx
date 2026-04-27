import { useNavigate } from 'react-router-dom';
import { FaTimes, FaBalanceScale } from 'react-icons/fa';
import { useCompare } from '../context/CompareContext';
import './CompareBar.css';

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  return (
    <div className="compare-bar">
      <div className="compare-bar-inner">
        <span className="compare-bar-label">
          <FaBalanceScale /> Comparar ({compareList.length})
        </span>

        <div className="compare-bar-products">
          {compareList.map((p) => {
            const img = p.images?.[0] || p.image || '';
            return (
              <div key={p.id} className="compare-bar-item">
                {img
                  ? <img src={img} alt={p.name} className="compare-bar-thumb" />
                  : <div className="compare-bar-thumb compare-bar-thumb--empty" />
                }
                <span className="compare-bar-name">{p.name}</span>
                <button
                  className="compare-bar-remove"
                  onClick={() => removeFromCompare(p.id)}
                  aria-label={`Remover ${p.name} da comparação`}
                >
                  <FaTimes />
                </button>
              </div>
            );
          })}
        </div>

        <div className="compare-bar-actions">
          <button
            className="compare-bar-btn compare-bar-btn--primary"
            onClick={() => navigate('/comparar')}
            disabled={compareList.length < 2}
          >
            Comparar agora
          </button>
          <button
            className="compare-bar-btn compare-bar-btn--ghost"
            onClick={clearCompare}
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
