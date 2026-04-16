// ─────────────────────────────────────────────────────────────────
// main.jsx — Ponto de entrada da aplicação React
//
// Este arquivo inicializa o React e monta o componente raiz <App />
// no elemento HTML com id="root" definido em index.html.
// O <StrictMode> ativa verificações extras durante o desenvolvimento,
// como detecção de efeitos colaterais inesperados.
//
// Para adicionar provedores globais (ex: contexto de tema, Redux),
// envolva <App /> dentro deles aqui.
// ─────────────────────────────────────────────────────────────────

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'   // Estilos globais do painel administrativo
import App from './App.jsx'

// Monta a árvore React no elemento #root do index.html
// StrictMode não altera o comportamento em produção — apenas ativa
// avisos adicionais no ambiente de desenvolvimento
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
