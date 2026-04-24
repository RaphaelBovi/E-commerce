const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

function authHeader() {
  try {
    const raw = localStorage.getItem('ecommerce_template_auth');
    if (!raw) return {};
    const s = JSON.parse(raw);
    return s?.token ? { Authorization: `Bearer ${s.token}` } : {};
  } catch {
    return {};
  }
}

async function apiFetch(path, options = {}) {
  const { body, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...options.headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export function fetchFavorites() {
  return apiFetch('/favorites');
}

export function toggleFavorite(productId) {
  return apiFetch(`/favorites/${productId}`, { method: 'POST' });
}

export function checkFavorites(productIds) {
  return apiFetch('/favorites/check', { method: 'POST', body: productIds });
}
