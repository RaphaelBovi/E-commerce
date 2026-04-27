const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

export async function fetchCategories() {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Erro ao carregar categorias");
  return res.json();
}
