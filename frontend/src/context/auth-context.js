// ─────────────────────────────────────────────────────────────────
// auth-context.js — Criação do contexto de autenticação
//
// Define o contexto React que armazena e distribui o estado de
// autenticação (usuário logado, funções de login/logout/registro)
// para todos os componentes da árvore que chamarem useAuth().
//
// O valor inicial é null (sem usuário autenticado).
// O AuthProvider (AuthProvider.jsx) é responsável por fornecer
// os valores reais a este contexto.
//
// Para adicionar novos dados ao contexto (ex.: permissões),
// inclua-os no objeto "value" dentro do AuthProvider.
// ─────────────────────────────────────────────────────────────────

import { createContext } from "react";

// Cria o contexto com valor padrão null; esse valor só é usado se um
// componente consumir o contexto sem estar dentro de um AuthProvider
export const AuthContext = createContext(null);
