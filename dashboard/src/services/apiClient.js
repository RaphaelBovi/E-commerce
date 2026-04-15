const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

function getAuthHeader() {
  const raw = sessionStorage.getItem("dashboard_admin_session");
  if (!raw) return {};
  try {
    const session = JSON.parse(raw);
    return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
  } catch {
    return {};
  }
}

export async function apiFetch(path, options = {}) {
  const { body, headers: extraHeaders, ...rest } = options;

  const fetchOptions = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
      ...extraHeaders,
    },
  };

  if (body !== undefined) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          message = json.message || json.error || text;
        } catch {
          message = text.length > 200 ? `${text.slice(0, 200)}…` : text;
        }
      }
    } catch { /* ignore */ }
    throw new Error(message);
  }

  return res.status === 204 ? null : res.json();
}
