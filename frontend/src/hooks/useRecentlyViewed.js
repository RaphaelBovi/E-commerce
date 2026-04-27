const KEY = 'ecommerce_recently_viewed';
const MAX = 8;

function getIds() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function addRecentlyViewed(productId) {
  const ids = getIds().filter(id => String(id) !== String(productId));
  ids.unshift(String(productId));
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
}

export function getRecentlyViewed(allProducts) {
  const ids = getIds();
  return ids
    .map(id => allProducts.find(p => String(p.id) === id))
    .filter(Boolean);
}
