import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaShoppingCart, FaStar, FaBoxOpen, FaBalanceScale } from 'react-icons/fa';
import { useCompare } from '../context/CompareContext';
import { useSEO } from '../hooks/useSEO';
import './Comparar.css';

const fmt = (v) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ROWS = [
  { label: 'Preço',      render: (p) => {
    if (p.isPromo) return (
      <span>
        <span className="cmp-old-price">{fmt(p.price)}</span>
        <span className="cmp-promo-price"> {fmt(p.promotionalPrice)}</span>
      </span>
    );
    return fmt(p.price);
  }},
  { label: 'Marca',      render: (p) => p.marca || '—' },
  { label: 'Categoria',  render: (p) => p.category || '—' },
  { label: 'Estoque',    render: (p) => p.qnt === 0
    ? <span className="cmp-badge cmp-badge--out">Esgotado</span>
    : <span className="cmp-badge cmp-badge--in">{p.qnt} un.</span>
  },
  { label: 'Avaliação',  render: (p) => p.reviewCount > 0
    ? <span className="cmp-rating"><FaStar /> {Number(p.averageRating).toFixed(1)} ({p.reviewCount})</span>
    : <span style={{ color: 'var(--text-muted)' }}>Sem avaliações</span>
  },
  { label: 'Referência', render: (p) => <code style={{ fontSize: '0.8rem' }}>{p.ref}</code> },
];

export default function Comparar({ onAddToCart }) {
  useSEO({ title: 'Comparar Produtos', noindex: true });
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) {
    return (
      <main className="cmp-main">
        <div className="container cmp-container">
          <div className="cmp-empty">
            <FaBalanceScale />
            <h2>Nenhum produto selecionado</h2>
            <p>Adicione produtos usando o botão "Comparar" nos cards do catálogo.</p>
            <Link to="/catalogo" className="cmp-btn-primary">Ver catálogo</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cmp-main">
      <div className="container cmp-container">
        <div className="cmp-header">
          <div>
            <h1 className="cmp-title">Comparação de Produtos</h1>
            <p className="cmp-subtitle">Comparando {compareList.length} produto{compareList.length > 1 ? 's' : ''}</p>
          </div>
          <button className="cmp-clear-btn" onClick={() => { clearCompare(); navigate('/catalogo'); }}>
            <FaTimes /> Limpar comparação
          </button>
        </div>

        <div className="cmp-table-wrapper">
          <table className="cmp-table">
            <thead>
              <tr>
                <th className="cmp-th-label"></th>
                {compareList.map((p) => (
                  <th key={p.id} className="cmp-th-product">
                    <div className="cmp-product-head">
                      <button className="cmp-remove-btn" onClick={() => removeFromCompare(p.id)} title="Remover">
                        <FaTimes />
                      </button>
                      <Link to={`/produto/${p.id}`}>
                        {(p.images?.[0] || p.image)
                          ? <img src={p.images?.[0] || p.image} alt={p.name} className="cmp-product-img" />
                          : <div className="cmp-product-img cmp-product-img--empty"><FaBoxOpen /></div>
                        }
                        <p className="cmp-product-name">{p.name}</p>
                      </Link>
                      {onAddToCart && (
                        <button
                          className="cmp-add-btn"
                          onClick={() => onAddToCart(p)}
                          disabled={p.qnt === 0}
                        >
                          <FaShoppingCart /> {p.qnt === 0 ? 'Esgotado' : 'Adicionar'}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="cmp-row-label">{row.label}</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="cmp-row-value">{row.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cmp-footer">
          <Link to="/catalogo" className="cmp-back-link">← Voltar ao catálogo</Link>
        </div>
      </div>
    </main>
  );
}
