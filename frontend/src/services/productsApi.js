const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product.price),
  qnt: Number(product.qnt),
  marca: product.marca ?? "",
});

export async function fetchProducts() {
  const endpoints = [
    `${API_BASE_URL}/product-category`,
    `${API_BASE_URL}/product-category/all`,
  ];

  let lastStatus = null;
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        return data.map(normalizeProduct);
      }
      lastStatus = response.status;
    } catch (error) {
      // Network/CORS failures throw before an HTTP status exists.
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error(`Erro de comunicação com a API (${lastError.message || "sem resposta"})`);
  }

  throw new Error(`Erro ao buscar produtos (${lastStatus ?? "sem resposta"})`);
}
