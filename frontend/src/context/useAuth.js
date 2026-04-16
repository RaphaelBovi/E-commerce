// ─────────────────────────────────────────────────────────────────
// useAuth.js — Hook personalizado para acessar o contexto de autenticação
//
// Simplifica o consumo do AuthContext em qualquer componente:
// em vez de importar AuthContext + useContext em cada arquivo,
// basta importar e chamar useAuth().
//
// Retorna: { user, login, register, logout, isAuthenticated }
//
// Uso:
//   const { user, logout, isAuthenticated } = useAuth();
//
// ATENÇÃO: este hook só funciona dentro da árvore coberta pelo
// AuthProvider. Caso contrário, lança um erro explicativo.
// ─────────────────────────────────────────────────────────────────

import { useContext } from "react";
import { AuthContext } from "./auth-context";

// Hook que lê o valor atual do AuthContext
// Lança um erro claro se usado fora do AuthProvider
export function useAuth() {
  const ctx = useContext(AuthContext);
  // Proteção: garante que o hook não seja usado sem o Provider correspondente
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
