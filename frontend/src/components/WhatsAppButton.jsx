import React from 'react';
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  return (
    <a 
      href="https://wa.me/5511999999999" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="whatsapp-float"
      title="Fale com um consultor"
    >
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
        alt="WhatsApp" 
      />
    </a>
  );
}