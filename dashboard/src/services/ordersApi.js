import { apiFetch } from "./apiClient.js";

export function getAllOrders() {
  return apiFetch("/orders");
}

export function getOrderById(id) {
  return apiFetch(`/orders/${id}`);
}

export function updateOrderStatus(id, status) {
  return apiFetch(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
