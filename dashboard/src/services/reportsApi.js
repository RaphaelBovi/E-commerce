import { apiFetch } from "./apiClient.js";

// GET /api/orders/admin/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Retorna: { totalRevenue, totalOrders, avgOrderValue, ordersByStatus, revenueByDay, topProducts }
export function getAdminSummary(from, to) {
  const params = new URLSearchParams({ from, to });
  return apiFetch(`/orders/admin/summary?${params.toString()}`);
}
