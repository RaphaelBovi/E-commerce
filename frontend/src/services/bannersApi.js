const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

export async function fetchBanners(position = 'HERO') {
  try {
    const res = await fetch(`${API_BASE}/banners?position=${position}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
