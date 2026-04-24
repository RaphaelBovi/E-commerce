import { apiFetch } from './apiClient.js';

export const TICKET_STATUS_LABELS = {
  OPEN:              'Aberto',
  IN_PROGRESS:       'Em atendimento',
  AWAITING_RESPONSE: 'Aguardando cliente',
  CLOSED:            'Encerrado',
};

export const TICKET_STATUS_OPTIONS = [
  { value: 'OPEN',              label: 'Aberto' },
  { value: 'IN_PROGRESS',       label: 'Em atendimento' },
  { value: 'AWAITING_RESPONSE', label: 'Aguardando cliente' },
  { value: 'CLOSED',            label: 'Encerrado' },
];

export function fetchAllTickets()           { return apiFetch('/admin/tickets'); }
export function fetchTicket(id)             { return apiFetch(`/admin/tickets/${id}`); }
export function replyTicket(id, message)    { return apiFetch(`/admin/tickets/${id}/reply`, { method: 'POST', body: { message } }); }
export function updateTicketStatus(id, s)   { return apiFetch(`/admin/tickets/${id}/status`, { method: 'PATCH', body: { status: s } }); }
export function deleteTicket(id)            { return apiFetch(`/admin/tickets/${id}`, { method: 'DELETE' }); }
