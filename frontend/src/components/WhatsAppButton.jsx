// ─────────────────────────────────────────────────────────────────
// WhatsAppButton.jsx — Botão flutuante de contato via WhatsApp
//
// Renderiza um ícone do WhatsApp fixo no canto inferior direito
// da tela (posicionado via CSS com position: fixed).
// Abre o WhatsApp Web/aplicativo em nova aba ao ser clicado.
//
// Para personalizar:
//  - Altere o número no href (formato: https://wa.me/55DDDNUMERO)
//  - Substitua a imagem por outro ícone se preferir
//  - Edite o title para mudar o tooltip ao passar o mouse
//
// Não há props nem estado — componente puramente estático.
// ─────────────────────────────────────────────────────────────────

import React from 'react';
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  return (
    // Link externo que abre o WhatsApp com o número configurado
    // target="_blank" abre em nova aba
    // rel="noopener noreferrer" por segurança (impede acesso ao window.opener)
    <a
      href="https://wa.me/5511999999999"
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      title="Fale com um consultor"
    >
      {/* Ícone oficial do WhatsApp carregado do Wikimedia Commons */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
      />
    </a>
  );
}
