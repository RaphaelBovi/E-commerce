import { useEffect, useState } from "react";
import { FaStar, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import { listReviews, deleteReview } from "../services/reviewsApi.js";

function StarDisplay({ value }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar
          key={s}
          style={{ fontSize: "0.8rem", color: s <= value ? "var(--warning)" : "var(--border-strong)" }}
        />
      ))}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const PAGE_SIZE = 15;

export default function ReviewsAdmin() {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);

  const load = () => {
    setLoading(true);
    listReviews()
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Remover esta avaliação permanentemente?")) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    return !q ||
      r.userEmail?.toLowerCase().includes(q) ||
      r.userFullName?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Avaliações</h1>
          <p className="page-subtitle">
            {reviews.length} avaliações · média {avgRating} <FaStar style={{ color: "var(--warning)", fontSize: "0.85rem" }} />
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>Atualizar</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="pedidos-search" style={{ marginBottom: "1rem" }}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por e-mail, nome ou comentário…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}><FaTimes /></button>
          )}
        </div>

        {loading ? (
          <div className="spinner">Carregando avaliações…</div>
        ) : pageData.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "2rem 0", textAlign: "center" }}>
            Nenhuma avaliação encontrada.
          </p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produto ID</th>
                    <th>Usuário</th>
                    <th>Nota</th>
                    <th>Comentário</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        #{r.productId?.slice(0, 8)}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.875rem" }}>{r.userFullName || "—"}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{r.userEmail}</div>
                      </td>
                      <td><StarDisplay value={r.rating} /></td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: 260 }}>
                        <span title={r.comment}>
                          {r.comment ? (r.comment.length > 80 ? r.comment.slice(0, 80) + "…" : r.comment) : "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{formatDate(r.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: "var(--danger)" }}
                          title="Remover"
                          onClick={() => handleDelete(r.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
