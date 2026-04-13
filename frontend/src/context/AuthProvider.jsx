import React, { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import {
  clearSession,
  loadStoredSession,
  loginRequest,
  saveSession,
} from "../services/authApi";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredSession);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    const session = {
      token: data.token,
      email: data.email,
      role: data.role ?? "",
    };
    saveSession(session);
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
