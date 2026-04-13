const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

export const STORE_AUTH_KEY = "ecommerce_template_auth";

async function parseErrorMessage(response) {
  try {
    const text = await response.text();
    if (!text) {
      return response.status === 401 ? "E-mail ou senha incorretos." : `Erro ${response.status}`;
    }
    try {
      const body = JSON.parse(text);
      if (typeof body.message === "string") return body.message;
      if (Array.isArray(body.errors)) {
        return body.errors.map((e) => e.defaultMessage || e.message || String(e)).join(" ");
      }
      if (body.error) return String(body.error);
    } catch {
      /* not JSON */
    }
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
  } catch {
    return `Erro ${response.status}`;
  }
}

export function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORE_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.email) return null;
    return {
      token: String(parsed.token),
      email: String(parsed.email),
      role: parsed.role != null ? String(parsed.role) : "",
    };
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(STORE_AUTH_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORE_AUTH_KEY);
}

export function getAuthHeader() {
  const session = loadStoredSession();
  if (!session?.token) return {};
  return { Authorization: `Bearer ${session.token}` };
}

export async function loginRequest(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}
