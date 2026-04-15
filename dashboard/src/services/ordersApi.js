// ─────────────────────────────────────────────────────────────────
// ordersApi.js — Funções de acesso à API de pedidos (admin)
//
// Todos os endpoints aqui exigem token JWT de ADMIN ou MASTER.
// O token é adicionado automaticamente pelo apiClient.js.
//
// Endpoints consumidos:
//   GET   /api/orders             — todos os pedidos
//   GET   /api/orders/{id}        — pedido por ID
//   PATCH /api/orders/{id}/status — atualizar status
// ─────────────────────────────────────────────────────────────────

import { apiFetch } from "./apiClient.js";

// Retorna todos os pedidos do sistema, ordenados do mais recente ao mais antigo
// Usado pelo DashboardHome (resumo) e GestaoPedidos (lista completa)
export function getAllOrders() {
  return apiFetch("/orders");
}

// Retorna um pedido específico pelo UUID
// Usado para carregar os detalhes no modal de pedido
export function getOrderById(id) {
  return apiFetch(`/orders/${id}`);
}

// Atualiza o status de um pedido
// id     — UUID do pedido
// status — novo status (ex: "PAID", "SHIPPED", "DELIVERED")
// Para ver todos os valores válidos: OrderStatus.java no backend
export function updateOrderStatus(id, status) {
  return apiFetch(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status }, // envia { "status": "SHIPPED" } como JSON
  });
}
