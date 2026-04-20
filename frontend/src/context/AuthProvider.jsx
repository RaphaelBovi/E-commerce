// ─────────────────────────────────────────────────────────────────
// AuthProvider.jsx — Provedor do contexto de autenticação
//
// Envolve a aplicação (ou parte dela) para fornecer o estado de
// autenticação e as funções de login, registro e logout a todos
// os componentes filhos via AuthContext.
//
// Fluxo:
//  1. Ao montar, tenta recuperar a sessão salva no localStorage
//  2. login() chama a API, salva o token e atualiza o estado
//  3. register() faz o mesmo após criar a conta
//  4. logout() remove a sessão do localStorage e limpa o estado
//
// Para adicionar dados extras ao contexto (ex.: papel do usuário),
// inclua-os no objeto "value" dentro do useMemo abaixo.
// ─────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import {
  clearSession,
  loadStoredSession,
  loginRequest,
  registerRequest,
  googleLoginRequest,
  saveSession,
} from "../services/authApi";

// Props:
//  - children: qualquer elemento React que precisar de autenticação
export default function AuthProvider({ children }) {
  // Estado do usuário autenticado: { token, email, role } ou null
  // loadStoredSession é passado como função (lazy initializer) para
  // ler o localStorage apenas uma vez na montagem, sem re-executar nos re-renders
  const [user, setUser] = useState(loadStoredSession);

  // ─── Login ──────────────────────────────────────────────────────
  // Faz a requisição de login, persiste a sessão no localStorage
  // e atualiza o estado com os dados do usuário retornados pela API.
  // useCallback garante que a referência da função não muda entre renders,
  // evitando re-renderizações desnecessárias nos consumidores do contexto.
  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    const session = {
      token: data.token,
      email: data.email,
      role: data.role ?? "",
    };
    // Persiste a sessão para sobreviver a recarregamentos de página
    saveSession(session);
    setUser(session);
  }, []);

  // ─── Registro ───────────────────────────────────────────────────
  // Cria uma nova conta via API, salva a sessão retornada e
  // loga o usuário automaticamente após o cadastro bem-sucedido.
  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload);
    const session = {
      token: data.token,
      email: data.email,
      role: data.role ?? "",
    };
    saveSession(session);
    setUser(session);
  }, []);

  // ─── Google Login ────────────────────────────────────────────────
  // Verifies Google ID token via backend and starts session.
  const googleLogin = useCallback(async (idToken) => {
    const data = await googleLoginRequest(idToken);
    const session = { token: data.token, email: data.email, role: data.role ?? "" };
    saveSession(session);
    setUser(session);
  }, []);

  // ─── Login with Token ────────────────────────────────────────────
  // Saves an already-obtained AuthResponse directly (used after OTP confirm).
  const loginWithToken = useCallback((data) => {
    const session = { token: data.token, email: data.email, role: data.role ?? "" };
    saveSession(session);
    setUser(session);
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────
  // Remove a sessão do localStorage e define o usuário como null,
  // forçando todos os componentes que consomem o contexto a atualizar.
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // ─── Valor do contexto ──────────────────────────────────────────
  // useMemo evita recriar o objeto a cada render; só recria quando
  // alguma das dependências (user, login, register, logout) mudar.
  // isAuthenticated é true sempre que houver um usuário logado.
  const value = useMemo(
    () => ({
      user,
      login,
      register,
      googleLogin,
      loginWithToken,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, login, register, googleLogin, loginWithToken, logout]
  );

  // Fornece o valor calculado para todos os componentes filhos
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
