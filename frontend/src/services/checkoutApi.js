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

// Fetches the PagSeguro RSA public key from the backend.
// The frontend SDK uses this key to encrypt card data before sending it to the server.
export async function getPagseguroPublicKey() {
  const res = await fetch(`${BASE}/payments/public-key`, {
    headers: { ...getAuthHeader(), Accept: 'application/json' },
  });
  return handleResponse(res);
}

// Submits the full checkout payload (encrypted card + address + cart items) to the backend.
// The backend creates the order and charges the card via PagSeguro in one atomic call.
export async function processCheckout({ encryptedCard, holderName, installments, deliveryAddress, items }) {
  const res = await fetch(`${BASE}/checkout`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ encryptedCard, holderName, installments, deliveryAddress, items }),
  });
  return handleResponse(res);
}

// Creates a PagSeguro redirect checkout session.
// Returns { orderId, paymentUrl } — the caller should redirect to paymentUrl.
export async function createCheckoutSession(payload) {
  const res = await fetch(`${BASE}/checkout/session`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
