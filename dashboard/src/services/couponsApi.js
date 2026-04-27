import { apiFetch } from "./apiClient.js";

export const listCoupons       = ()             => apiFetch("/admin/coupons");
export const createCoupon      = (data)         => apiFetch("/admin/coupons", { method: "POST", body: data });
export const activateCoupon    = (id)           => apiFetch(`/admin/coupons/${id}/activate`, { method: "PATCH" });
export const deactivateCoupon  = (id)           => apiFetch(`/admin/coupons/${id}/deactivate`, { method: "PATCH" });
export const deleteCoupon      = (id)           => apiFetch(`/admin/coupons/${id}`, { method: "DELETE" });
