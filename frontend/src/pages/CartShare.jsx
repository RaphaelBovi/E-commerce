import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaShoppingCart, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { getSharedCart } from '../services/cartShareApi';
import { useSEO } from '../hooks/useSEO';
import './CartShare.css';

const fmt = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CartShare({ onAddToCart }) {
  useSEO({ title: 'Carrinho Compartilhado' });

  const { token } = useParams();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [added, setAdded]     = useState(false);

  useEffect(() => {
    getSharedCart(token)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAddAll = () => {
    items.forEach((item) => {
      onAddToCart(
        { ...item, qnt: item.variantQnt ?? item.qnt ?? 999 },
        item.quantity,
        item.variantId
          ? { variantId: item.variantId, variantName: item.variantName, variantPrice: item.price, variantQnt: item.variantQnt }
          : null
      );
    });
    setAdded(true);
  };

  if (loading) {
    return (
      <main className="cs-main">
        <div className="cs-container">
          <div className="cs-card cs-loading">
            <div className="cs-spinner" />
            <p>Carregando carrinho...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="cs-main">
        <div className="cs-container">
          <div className="cs-card cs-error">
            <FaExclamationTriangle className="cs-icon cs-icon--warn" />
            <h2>Link inválido ou expirado</h2>
            <p>{error}</p>
            <Link to="/catalogo" className="cs-btn cs-btn--primary">Ver catálogo</Link>
          </div>
        </div>
      </main>
    );
  }

  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <main className="cs-main">
      <div className="cs-container">
        <div className="cs-card">
          <div className="cs-header">
            <FaShoppingCart className="cs-icon cs-icon--primary" />
            <div>
              <h1 className="cs-title">Carrinho Compartilhado</h1>
              <p className="cs-subtitle">{items.length} {items.length === 1 ? 'item' : 'itens'} · Total {fmt(total)}</p>
            </div>
          </div>

          <ul className="cs-list">
            {items.map((item, i) => (
              <li key={i} className="cs-item">
                {item.image && (
                  <img src={item.image} alt={item.name} className="cs-item-img" loading="lazy" />
                )}
                <div className="cs-item-info">
                  <span className="cs-item-name">{item.name}</span>
                  {item.variantName && (
                    <span className="cs-item-variant">{item.variantName}</span>
                  )}
                  <span className="cs-item-qty">Qtd: {item.quantity}</span>
                </div>
                <span className="cs-item-price">{fmt(Number(item.price) * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="cs-footer">
            <div className="cs-total">
              <span>Total</span>
              <strong>{fmt(total)}</strong>
            </div>

            {added ? (
              <div className="cs-success">
                <FaCheckCircle />
                <span>Itens adicionados ao seu carrinho!</span>
              </div>
            ) : (
              <button className="cs-btn cs-btn--primary" onClick={handleAddAll}>
                <FaShoppingCart /> Adicionar tudo ao meu carrinho
              </button>
            )}

            <Link to="/catalogo" className="cs-btn cs-btn--ghost">Continuar comprando</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
