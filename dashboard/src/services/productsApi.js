// ─────────────────────────────────────────────────────────────────
// productsApi.js — Funções de acesso à API de produtos
//
// Leitura (GET) é pública — sem token necessário.
// Escrita (POST, PUT, DELETE) exige token de ADMIN ou MASTER.
// O token é adicionado automaticamente pelo apiClient.js.
//
// Endpoints consumidos:
//   GET    /api/product-category          — lista todos os produtos
//   GET    /api/product-category/ref/{ref} — produto por referência
//   POST   /api/product-category          — criar produto
//   PUT    /api/product-category/{ref}    — editar produto
//   DELETE /api/product-category/ref/{ref} — excluir por referência
// ─────────────────────────────────────────────────────────────────

import { apiFetch } from "./apiClient.js";

// Normaliza um produto vindo do backend para garantir tipos corretos no frontend
// Evita erros com campos null/undefined — sempre retorna valores padrão seguros
const normalizeProduct = (p) => ({
  ...p,
  price:            Number(p.price ?? 0),
  promotionalPrice: p.promotionalPrice != null ? Number(p.promotionalPrice) : null,
  isPromo:          p.isPromo != null
                      ? Boolean(p.isPromo)
                      : (p.promotionalPrice != null && Number(p.promotionalPrice) < Number(p.price)),
  qnt:              Number(p.qnt ?? 0),
  marca:            p.marca    || "",
  category:         p.category || "geral",
  image:            p.image    || "",
  images:           Array.isArray(p.images) ? p.images : [],
});

// Converte os campos do formulário para o formato que o backend espera
// Faz trim() nas strings e converte preço/quantidade para número
const toPayload = (p) => ({
  name:             String(p.name     || "").trim(),
  ref:              String(p.ref      || "").trim(),
  price:            Number(p.price),
  promotionalPrice: p.promotionalPrice != null && p.promotionalPrice !== "" ? Number(p.promotionalPrice) : null,
  qnt:              Number(p.qnt),
  marca:            String(p.marca    || "").trim(),
  category:         String(p.category || "geral").trim(),
  image:            p.image ? String(p.image).trim() : null,
  images:           Array.isArray(p.images) ? p.images : [],
});

// Busca todos os produtos cadastrados
// Para mudar a quantidade retornada ou adicionar paginação: altere o backend em ProductController.java
export async function fetchProducts() {
  const data = await apiFetch("/product-category");
  return data.map(normalizeProduct); // normaliza cada item
}

// Busca um produto específico pela sua referência (código único)
// ref — código de referência (ex: "PROD-001")
export async function fetchProductByRef(ref) {
  const data = await apiFetch(`/product-category/ref/${encodeURIComponent(ref)}`);
  return normalizeProduct(data);
}

// Cria um novo produto no catálogo
// product — objeto com name, ref, price, qnt, marca, category, image
// Retorna o produto criado com o ID gerado pelo banco
export async function createProduct(product) {
  const data = await apiFetch("/product-category", {
    method: "POST",
    body: JSON.stringify(toPayload(product)),
  });
  return normalizeProduct(data);
}

// Edita um produto existente pela sua referência
// ref     — referência do produto a editar
// product — novos dados do produto
// Nota: a referência em si não pode ser alterada (é usada como chave)
export async function updateProductByRef(ref, product) {
  const data = await apiFetch(`/product-category/${encodeURIComponent(ref)}`, {
    method: "PUT",
    body: JSON.stringify(toPayload(product)),
  });
  return normalizeProduct(data);
}

// Remove um produto do catálogo pela sua referência
// ref — referência do produto a excluir
// Ação irreversível — não há lixeira ou soft delete implementado
export async function deleteProductByRef(ref) {
  await apiFetch(`/product-category/ref/${encodeURIComponent(ref)}`, {
    method: "DELETE",
  });
  // DELETE retorna 204 No Content — apiFetch retorna null, que ignoramos aqui
}

// Importa produtos em lote via arquivo CSV.
// Usa fetch diretamente (sem Content-Type JSON) para enviar multipart/form-data.
export async function importProductsCsv(file) {
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");
  const raw = sessionStorage.getItem("dashboard_admin_session");
  const token = raw ? JSON.parse(raw)?.token : null;

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/product-category/import`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `Erro ${res.status}`;
    try { msg = JSON.parse(text).message || msg; } catch { if (text) msg = text; }
    throw new Error(msg);
  }
  return res.json();
}
