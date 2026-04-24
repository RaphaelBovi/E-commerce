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
    let msg = `Erro ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try { msg = JSON.parse(text).message || text; } catch { msg = text; }
      }
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export const TICKET_STATUS_LABELS = {
  OPEN:              'Aberto',
  IN_PROGRESS:       'Em atendimento',
  AWAITING_RESPONSE: 'Aguardando sua resposta',
  CLOSED:            'Encerrado',
};

export const TICKET_CATEGORIES = [
  'Pedido e entrega',
  'Pagamento',
  'Produto com defeito',
  'Troca e devolução',
  'Dúvida sobre produto',
  'Cancelamento',
  'Outro',
];

export function fetchMyTickets()         { return apiFetch('/tickets'); }
export function fetchMyTicket(id)        { return apiFetch(`/tickets/${id}`); }
export function createTicket(data)       { return apiFetch('/tickets', { method: 'POST', body: data }); }
export function replyTicket(id, message) { return apiFetch(`/tickets/${id}/reply`, { method: 'POST', body: { message } }); }
