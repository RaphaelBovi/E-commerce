import { Link } from 'react-router-dom';
import './Breadcrumb.css';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="bc-item">
            {isLast || !item.href
              ? <span className="bc-current" aria-current="page">{item.label}</span>
              : <Link to={item.href} className="bc-link">{item.label}</Link>
            }
            {!isLast && <span className="bc-sep" aria-hidden="true">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
