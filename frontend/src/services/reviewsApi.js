import { getAuthHeader } from './authApi';

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch { /* use default */ }
    throw new Error(message);
  }
  return res.json();
}

// Retorna { averageRating, totalCount, distribution, reviews }
export async function getProductReviews(productId) {
  const res = await fetch(`${BASE}/reviews/${productId}`);
  return handleResponse(res);
}

// Verifica se o usuário logado pode avaliar o produto
export async function canReviewProduct(productId) {
  const res = await fetch(`${BASE}/reviews/${productId}/can-review`, {
    headers: getAuthHeader(),
  });
  return handleResponse(res);
}

// Envia avaliação: { rating, comment }
export async function submitReview(productId, data) {
  const res = await fetch(`${BASE}/reviews/${productId}`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
