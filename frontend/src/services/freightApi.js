const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

export async function calculateFreight({ zipCode, items }) {
  const res = await fetch(`${API_BASE_URL}/freight/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ zipCode, items }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Erro ${res.status} ao calcular frete`);
  }
  return res.json();
}
