// ─────────────────────────────────────────────────────────────────
// apiClient.js — Cliente HTTP centralizado do dashboard
//
// Todas as chamadas ao backend passam por aqui.
// Benefícios:
//   • Adiciona automaticamente o token JWT em cada requisição
//   • Trata erros de forma padronizada
//   • Define a URL base da API (configurável por variável de ambiente)
//
// Para trocar a URL do backend: defina VITE_API_BASE_URL no arquivo .env
// ─────────────────────────────────────────────────────────────────

// URL base da API — usa variável de ambiente ou localhost em desenvolvimento
// import.meta.env.VITE_* — variáveis de ambiente do Vite (frontend)
// .replace(/\/+$/, "") — remove barras extras do final da URL
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

// Lê o token JWT armazenado na sessão do administrador
// sessionStorage — persiste apenas enquanto o navegador está aberto (mais seguro que localStorage)
// "dashboard_admin_session" — chave onde o token, e-mail e papel são salvos após o login
function getAuthHeader() {
  const raw = sessionStorage.getItem("dashboard_admin_session");
  if (!raw) return {}; // não logado — sem header de autenticação
  try {
    const session = JSON.parse(raw);
    // Monta o header Authorization com o padrão Bearer <token>
    return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
  } catch {
    return {}; // JSON inválido — trata como não autenticado
  }
}

// Função principal de requisição HTTP
// path   — caminho relativo (ex: "/orders", "/product-category")
// options — opções extras do fetch (method, body, headers etc.)
export async function apiFetch(path, options = {}) {
  const { body, headers: extraHeaders, ...rest } = options;

  // Monta as opções completas da requisição
  const fetchOptions = {
    ...rest,
    headers: {
      "Content-Type": "application/json", // sempre envia e recebe JSON
      Accept: "application/json",
      ...getAuthHeader(),   // adiciona o token JWT automaticamente
      ...extraHeaders,      // permite sobrescrever headers específicos se necessário
    },
  };

  // Adiciona o body apenas se ele foi fornecido (GET e DELETE não têm body)
  if (body !== undefined) {
    // Aceita string (JSON já serializado) ou objeto (serializa automaticamente)
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  // Faz a requisição ao backend
  const res = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  // Se o servidor retornou erro (4xx ou 5xx), extrai a mensagem e lança exceção
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          // Tenta parsear como JSON para pegar o campo "message" ou "error"
          const json = JSON.parse(text);
          message = json.message || json.error || text;
        } catch {
          // Se não for JSON, usa o texto diretamente (limita a 200 chars)
          message = text.length > 200 ? `${text.slice(0, 200)}…` : text;
        }
      }
    } catch { /* ignora erros ao ler o corpo do erro */ }
    throw new Error(message); // propaga para o componente que chamou
  }

  // HTTP 204 No Content — sucesso sem corpo de resposta (ex: DELETE)
  return res.status === 204 ? null : res.json();
}
