import { apiFetch } from "./apiClient.js";

const normalizeProduct = (p) => ({
  ...p,
  price:    Number(p.price ?? 0),
  qnt:      Number(p.qnt ?? 0),
  marca:    p.marca || "",
  category: p.category || "geral",
  image:    p.image || "",
});

const toPayload = (p) => ({
  name:     String(p.name    || "").trim(),
  ref:      String(p.ref     || "").trim(),
  price:    Number(p.price),
  qnt:      Number(p.qnt),
  marca:    String(p.marca   || "").trim(),
  category: String(p.category || "geral").trim(),
  image:    p.image ? String(p.image).trim() : null,
});

export async function fetchProducts() {
  const data = await apiFetch("/product-category");
  return data.map(normalizeProduct);
}

export async function fetchProductByRef(ref) {
  const data = await apiFetch(`/product-category/ref/${encodeURIComponent(ref)}`);
  return normalizeProduct(data);
}

export async function createProduct(product) {
  const data = await apiFetch("/product-category", {
    method: "POST",
    body: JSON.stringify(toPayload(product)),
  });
  return normalizeProduct(data);
}

export async function updateProductByRef(ref, product) {
  const data = await apiFetch(`/product-category/${encodeURIComponent(ref)}`, {
    method: "PUT",
    body: JSON.stringify(toPayload(product)),
  });
  return normalizeProduct(data);
}

export async function deleteProductByRef(ref) {
  await apiFetch(`/product-category/ref/${encodeURIComponent(ref)}`, {
    method: "DELETE",
  });
}
