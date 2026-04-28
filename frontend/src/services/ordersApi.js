import { getAuthHeader } from './authApi';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const text = await response.text();
      if (text) {
        try {
          const body = JSON.parse(text);
          message = body.message || body.error || message;
        } catch {
          message = text.length > 200 ? `${text.slice(0, 200)}…` : text;
        }
      }
    } catch { /* use default */ }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function getMyOrders() {
  const response = await fetch(`${API_BASE_URL}/orders/my`, {
    headers: { ...getAuthHeader(), Accept: 'application/json' },
  });
  return handleResponse(response);
}

export async function getMyOrderById(id) {
  const response = await fetch(`${API_BASE_URL}/orders/my/${id}`, {
    headers: { ...getAuthHeader(), Accept: 'application/json' },
  });
  return handleResponse(response);
}

export async function cancelMyOrder(id) {
  const response = await fetch(`${API_BASE_URL}/orders/my/${id}/cancel`, {
    method: 'PATCH',
    headers: { ...getAuthHeader(), Accept: 'application/json' },
  });
  return handleResponse(response);
}

export async function getOrderTracking(id) {
  const response = await fetch(`${API_BASE_URL}/orders/my/${id}/tracking`, {
    headers: { ...getAuthHeader(), Accept: 'application/json' },
  });
  return handleResponse(response);
}

// Gera uma nova URL de pagamento para um pedido PENDING_PAYMENT dentro do prazo.
// Retorna { orderId, paymentUrl } para redirecionar o usuário ao gateway.
export async function getOrderPaymentLink(id) {
  const response = await fetch(`${API_BASE_URL}/orders/my/${id}/payment-link`, {
    method: 'POST',
    headers: { ...getAuthHeader(), Accept: 'application/json' },
  });
  return handleResponse(response);
}
