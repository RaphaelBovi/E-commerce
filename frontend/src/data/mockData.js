const PLACEHOLDER_IMAGE =
  "https://69dd8cc0e119e1c728d1a8e4.imgix.net/ProductTemplate/ChatGPT%20Image%20Apr%2013,%202026,%2009_31_25%20PM.png";

function categoryForIndex(i) {
  if (i <= 12) return "mais-vendidos";
  if (i <= 24) return "novidades";
  return "geral";
}

/**
 * Mock de 40 produtos.
 * createdAt simula datas: produto 40 = mais recente, produto 1 = mais antigo.
 */
export const products = Array.from({ length: 40 }, (_, idx) => {
  const i = idx + 1;
  const daysAgo = 40 - i; // i=40 → daysAgo=0 (hoje); i=1 → daysAgo=39
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);

  return {
    id: i,
    name: `Produto ${i}`,
    ref: `REF-${String(i).padStart(3, "0")}`,
    price: Number((49.9 + ((i * 193) % 9500) + (i % 7) * 11).toFixed(2)),
    category: categoryForIndex(i),
    image: PLACEHOLDER_IMAGE,
    createdAt: createdAt.toISOString(),
  };
});
