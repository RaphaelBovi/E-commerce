// ─────────────────────────────────────────────────────────────────
// authApi.js — Serviço de autenticação e gerenciamento de sessão
//
// Centraliza todas as chamadas à API relacionadas a autenticação
// (login e registro) e o gerenciamento da sessão no localStorage.
//
// A URL base é lida da variável de ambiente VITE_API_BASE_URL.
// Se não estiver definida, usa http://localhost:8080/api como padrão.
//
// Para adicionar novos endpoints (ex.: recuperar senha), crie uma
// função async similar a loginRequest() abaixo.
// ─────────────────────────────────────────────────────────────────

// URL base da API: lida do .env ou usa localhost como fallback
// A regex remove barras finais duplicadas (ex.: "http://api.com//")
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

// Chave usada para armazenar/recuperar a sessão no localStorage
export const STORE_AUTH_KEY = "ecommerce_template_auth";

// ─── parseErrorMessage ───────────────────────────────────────────
// Função auxiliar interna: extrai a mensagem de erro de uma
// resposta HTTP malsucedida (status não-2xx).
// Tenta ler JSON, depois texto puro, e por último usa o status HTTP.
// Isso garante que o AuthProvider sempre receba uma mensagem legível.
async function parseErrorMessage(response) {
  try {
    const text = await response.text();
    if (!text) {
      // Sem corpo na resposta: mensagem genérica baseada no status
      return response.status === 401 ? "E-mail ou senha incorretos." : `Erro ${response.status}`;
    }
    try {
      // Tenta interpretar o corpo como JSON e extrair o campo de erro
      const body = JSON.parse(text);
      if (typeof body.message === "string") return body.message;
      if (Array.isArray(body.errors)) {
        // Suporte a respostas com array de erros (ex.: Bean Validation do Spring)
        return body.errors.map((e) => e.defaultMessage || e.message || String(e)).join(" ");
      }
      if (body.error) return String(body.error);
    } catch {
      /* corpo não é JSON — usa o texto bruto abaixo */
    }
    // Limita o tamanho da mensagem para não poluir a interface
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
  } catch {
    return `Erro ${response.status}`;
  }
}

// ─── loadStoredSession ───────────────────────────────────────────
// Recupera a sessão salva no localStorage.
// Retorna { token, email, role } ou null se não houver sessão válida.
// Chamada no inicializador lazy do useState em AuthProvider.
export function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORE_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Valida que os campos obrigatórios existem antes de retornar
    if (!parsed?.token || !parsed?.email) return null;
    return {
      token: String(parsed.token),
      email: String(parsed.email),
      role: parsed.role != null ? String(parsed.role) : "",
    };
  } catch {
    // JSON inválido ou localStorage indisponível (ex.: modo privado restrito)
    return null;
  }
}

// ─── saveSession ─────────────────────────────────────────────────
// Persiste o objeto de sessão no localStorage como JSON.
// Chamada após login ou registro bem-sucedido.
export function saveSession(session) {
  localStorage.setItem(STORE_AUTH_KEY, JSON.stringify(session));
}

// ─── clearSession ────────────────────────────────────────────────
// Remove a sessão do localStorage.
// Chamada no logout para garantir que o usuário precisa autenticar novamente.
export function clearSession() {
  localStorage.removeItem(STORE_AUTH_KEY);
}

// ─── getAuthHeader ───────────────────────────────────────────────
// Retorna o header Authorization com o token Bearer para requisições
// autenticadas. Se não houver token, retorna um objeto vazio.
// Uso: headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
export function getAuthHeader() {
  const session = loadStoredSession();
  if (!session?.token) return {};
  return { Authorization: `Bearer ${session.token}` };
}

// ─── loginRequest ────────────────────────────────────────────────
// Envia as credenciais para POST /auth/login.
// Em caso de sucesso, retorna o JSON com { token, email, role }.
// Em caso de erro HTTP, lança um Error com mensagem legível.
export async function loginRequest(email, password, captchaToken) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(captchaToken ? { "X-Captcha-Token": captchaToken } : {}),
    },
    body: JSON.stringify({ email, password }),
  });

  // Se a resposta não for 2xx, extrai a mensagem de erro e lança
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}

// ─── getUserProfile ──────────────────────────────────────────────
// Retorna os dados completos do usuário autenticado (GET /auth/me).
export async function getUserProfile() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { ...getAuthHeader(), Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.json();
}

// ─── updateProfile ───────────────────────────────────────────────
// Atualiza dados pessoais do usuário (PATCH /auth/me).
// Campos: fullName, phone, birthDate, address, city, state, zipCode
export async function updateProfile(data) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PATCH',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.json();
}

// ─── changePassword ──────────────────────────────────────────────
// Altera a senha do usuário (PATCH /auth/me/password).
// Requer currentPassword e newPassword.
export async function changePassword(data) {
  const response = await fetch(`${API_BASE_URL}/auth/me/password`, {
    method: 'PATCH',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
}

// ─── sendVerificationCode ────────────────────────────────────────
// Validates all registration data and sends OTP to the user's email.
// POST /auth/register/initiate — returns 202, no body.
export async function sendVerificationCode(payload, captchaToken) {
  const response = await fetch(`${API_BASE_URL}/auth/register/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(captchaToken ? { "X-Captcha-Token": captchaToken } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
}

// ─── confirmRegistration ─────────────────────────────────────────
// Verifies OTP and creates the account. Returns { token, email, role }.
export async function confirmRegistration(email, code) {
  const response = await fetch(`${API_BASE_URL}/auth/register/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.json();
}

// ─── requestPasswordReset ────────────────────────────────────────
// Sends a password reset code to the given email.
// POST /auth/forgot-password — always returns 202 (no body).
// Does NOT reveal whether the email is registered.
export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
}

// ─── confirmPasswordReset ────────────────────────────────────────
// Verifies the OTP and sets the new password.
// POST /auth/reset-password — returns 204 No Content on success.
export async function confirmPasswordReset(email, token, newPassword) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, token, newPassword }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
}

// ─── googleLoginRequest ──────────────────────────────────────────
// Sends Google ID token to backend.
// Returns { newUser:false, token, email, role } for existing accounts,
// or { newUser:true, email, fullName, setupToken } for first-time Google users.
export async function googleLoginRequest(idToken) {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.json();
}

// ─── googleSetupSendOtp ──────────────────────────────────────────
// Sets password for a pending Google account and triggers OTP email.
// POST /auth/google/setup — returns 202, no body.
export async function googleSetupSendOtp(email, fullName, password, setupToken) {
  const response = await fetch(`${API_BASE_URL}/auth/google/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, fullName, password, setupToken }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
}

// ─── googleSetupConfirm ──────────────────────────────────────────
// Verifies OTP and creates the account. Returns { token, email, role }.
export async function googleSetupConfirm(email, code, setupToken) {
  const response = await fetch(`${API_BASE_URL}/auth/google/setup/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, code, setupToken }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.json();
}

// ─── registerRequest ─────────────────────────────────────────────
// Envia os dados de cadastro para POST /auth/register.
// O payload deve conter: email, password, fullName, cpf, birthDate,
// phone, address, city, state, zipCode.
// Em caso de sucesso, retorna { token, email, role } para login automático.
export async function registerRequest(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}

export async function deleteAccount() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "DELETE",
    headers: { ...getAuthHeader(), Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
}
