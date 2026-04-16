// ─────────────────────────────────────────────────────────────────
// main.jsx — Ponto de entrada da aplicação React
//
// Este arquivo inicializa o React e monta o componente raiz <App />
// dentro do elemento HTML com id="root" (definido em index.html).
// O <StrictMode> ativa avisos extras durante o desenvolvimento.
//
// Para adicionar providers globais (tema, i18n, etc.), envolva <App />
// com eles aqui dentro do <StrictMode>.
// ─────────────────────────────────────────────────────────────────

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Cria a raiz React apontando para o <div id="root"> do index.html
// e renderiza o componente principal dentro do modo estrito do React
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
