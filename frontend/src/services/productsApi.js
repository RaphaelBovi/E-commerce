// ─────────────────────────────────────────────────────────────────
// productsApi.js — Serviço de busca de produtos
//
// Fornece a função fetchProducts() que consulta a API de produtos
// e normaliza os dados recebidos para o formato esperado pelo frontend.
//
// A URL base é lida de VITE_API_BASE_URL (mesmo que authApi.js).
// O endpoint principal é GET /product-category.
//
// Para adicionar filtros ou busca por categoria via API, crie novas
// funções exportadas aqui e importe-as onde necessário.
// ─────────────────────────────────────────────────────────────────

// URL base da API: variável de ambiente ou localhost como fallback
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

// ─── normalizeProduct ────────────────────────────────────────────
// Garante que os campos numéricos (price, qnt) sejam sempre do tipo
// Number, independentemente de a API retornar string ou número.
// Isso evita erros de formatação de moeda e comparações de preço.
const normalizeProduct = (product) => ({
  ...product,
  price: Number(product.price),
  qnt: Number(product.qnt),
});

// ─── fetchProducts ───────────────────────────────────────────────
// Busca a lista completa de produtos da API.
// Tenta os endpoints definidos em `endpoints` em ordem.
// Se algum responder com status 2xx, retorna os produtos normalizados.
// Se todos falharem (erro de rede ou status não-2xx), lança um Error.
//
// A estrutura com array `endpoints` facilita adicionar endpoints
// alternativos (ex.: CDN de fallback) sem mudar a lógica de retry.
export async function fetchProducts() {
  // Lista de endpoints a tentar em ordem (atualmente apenas um)
  // Para adicionar um fallback: inclua mais URLs neste array
  const endpoints = [
    `${API_BASE_URL}/product-category`,
  ];

  let lastStatus = null;
  let lastError = null;

  // Tenta cada endpoint em sequência até um ter sucesso
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        // Resposta válida: converte JSON e normaliza cada produto
        const data = await response.json();
        return data.map(normalizeProduct);
      }
      // Resposta HTTP de erro (4xx, 5xx): salva o status e tenta o próximo
      lastStatus = response.status;
    } catch (error) {
      // Erro de rede ou CORS: nenhum status HTTP disponível
      lastError = error;
    }
  }

  // Todos os endpoints falharam — lança erro informativo
  if (lastError) {
    throw new Error(`Erro de comunicação com a API (${lastError.message || "sem resposta"})`);
  }

  throw new Error(`Erro ao buscar produtos (${lastStatus ?? "sem resposta"})`);
}
