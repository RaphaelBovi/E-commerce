import { apiFetch } from "./apiClient.js";

export const fetchPublicCategories = () => apiFetch("/categories");
export const fetchAdminCategories  = () => apiFetch("/admin/categories");
export const createCategory        = (name) => apiFetch("/admin/categories", { method: "POST", body: { name } });
export const renameCategory        = (id, name) => apiFetch(`/admin/categories/${id}`, { method: "PATCH", body: { name } });
export const toggleCategory        = (id) => apiFetch(`/admin/categories/${id}/toggle`, { method: "PATCH" });
export const deleteCategory        = (id) => apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
