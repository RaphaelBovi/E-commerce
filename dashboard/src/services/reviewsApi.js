import { apiFetch } from "./apiClient.js";

export const listReviews  = ()    => apiFetch("/admin/reviews");
export const deleteReview = (id)  => apiFetch(`/admin/reviews/${id}`, { method: "DELETE" });
