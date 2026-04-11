const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product.price ?? 0),
  qnt: Number(product.qnt ?? 0),
  marca: product.marca || "",
  category: product.category || "geral",
  image: product.image || "",
});

const parseErrorMessage = async (response) => {
  try {
    const body = await response.json();
    return body?.message || body?.error || `Erro ${response.status}`;
  } catch {
    return `Erro ${response.status}`;
  }
};

const productToRequestPayload = (product) => ({
  name: String(product.name || "").trim(),
  ref: String(product.ref || "").trim(),
  price: Number(product.price),
  qnt: Number(product.qnt),
  marca: String(product.marca || "").trim(),
  category: String(product.category || "geral").trim(),
  image: String(product.image || "").trim(),
});

export async function fetchProducts() {
  const endpoints = [
    `${API_BASE_URL}/product-category`,
    `${API_BASE_URL}/product-category/all`,
  ];

  let lastStatus = null;
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      return data.map(normalizeProduct);
    }
    lastStatus = response.status;
  }

  throw new Error(`Erro ao buscar produtos (${lastStatus ?? "sem resposta"})`);
}

export async function fetchProductByRef(ref) {
  const response = await fetch(`${API_BASE_URL}/product-category/ref/${encodeURIComponent(ref)}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = await response.json();
  return normalizeProduct(data);
}

export async function createProduct(product) {
  const response = await fetch(`${API_BASE_URL}/product-category`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productToRequestPayload(product)),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = await response.json();
  return normalizeProduct(data);
}

export async function updateProductByRef(ref, product) {
  const response = await fetch(`${API_BASE_URL}/product-category/${encodeURIComponent(ref)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productToRequestPayload(product)),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = await response.json();
  return normalizeProduct(data);
}

export async function deleteProductByRef(ref) {
  const response = await fetch(`${API_BASE_URL}/product-category/ref/${encodeURIComponent(ref)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function deleteProductById(id) {
  const response = await fetch(`${API_BASE_URL}/product-category/id/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}
