import { getAuthHeader } from './authApi';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

async function req(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(), ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = `Erro ${res.status}`;
    try { msg = JSON.parse(text).message || msg; } catch { if (text) msg = text; }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export const createReturn = (orderId, reason, itemsJson) =>
  req('/returns', { method: 'POST', body: JSON.stringify({ orderId, reason, itemsJson }) });

export const getMyReturns = () => req('/returns/my');
