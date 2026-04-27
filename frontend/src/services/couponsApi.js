import { getAuthHeader, STORE_AUTH_KEY } from './authApi';

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

async function handleResponse(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(STORE_AUTH_KEY);
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }
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

// Valida um cupom sem aplicá-lo — usado para exibir o desconto antes de confirmar
// Retorna: { code, type, discountValue, discountAmount, finalAmount }
export async function validateCoupon(code, orderAmount) {
  const res = await fetch(`${BASE}/coupons/validate`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, orderAmount }),
  });
  return handleResponse(res);
}
