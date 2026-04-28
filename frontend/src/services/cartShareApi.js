const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

import { getAuthHeader } from './authApi';

export async function shareCart(cartItems) {
  const res = await fetch(`${API}/cart/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(cartItems),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erro ao compartilhar carrinho.');
  }
  return res.json(); // { token }
}

export async function getSharedCart(token) {
  const res = await fetch(`${API}/cart/share/${token}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Link inválido ou expirado.');
  }
  const data = await res.json();
  return JSON.parse(data.itemsJson);
}
