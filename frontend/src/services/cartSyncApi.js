const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

function authHeader() {
  try {
    const raw = localStorage.getItem('ecommerce_template_auth');
    const token = raw ? JSON.parse(raw)?.token : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function syncCart(items) {
  await fetch(`${API_BASE}/cart/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(items),
  });
}

export async function clearCartSync() {
  await fetch(`${API_BASE}/cart/sync`, {
    method: 'DELETE',
    headers: authHeader(),
  });
}
