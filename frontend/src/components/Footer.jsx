// ─────────────────────────────────────────────────────────────────
// Footer.jsx — Rodapé da loja
//
// Componente estático (sem estado ou props) exibido em todas as páginas.
// Contém três seções principais:
//  1. Topo: colunas com central de vendas, atendimento e links rápidos
//  2. Rodapé intermediário: formas de pagamento e selos de segurança
//  3. Rodapé legal: texto de aviso do template
//
// Para personalizar: substitua os textos, telefones, e-mails e links
// diretamente no JSX abaixo. Para adicionar redes sociais ou mais
// colunas, basta incluir um novo <div className="footer-col">.
// ─────────────────────────────────────────────────────────────────

import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      {/* ── Seção superior: informações de contato e links úteis ── */}
      <div className="container footer-top">
        {/* Coluna 1: central de vendas com telefone principal */}
        <div className="footer-col">
          <h4>Central de vendas</h4>
          <p className="phone">0800 000 0000</p>
          <p>Segunda a sexta, 9h às 18h</p>
        </div>

        {/* Coluna 2: telefone de atendimento e e-mail de contato */}
        <div className="footer-col">
          <h4>Atendimento</h4>
          <p>(00) 0000-0000</p>
          <p>contato@sualoja.com.br</p>
        </div>

        {/* Coluna 3: links rápidos para áreas da conta e políticas */}
        <div className="footer-col">
          <ul className="footer-links">
            <li><a href="#conta">Minha conta</a></li>
            <li><a href="#pedidos">Meus pedidos</a></li>
            <li><a href="#privacidade">Privacidade</a></li>
            <li><a href="#trocas">Trocas e devoluções</a></li>
          </ul>
        </div>
      </div>

      {/* ── Seção intermediária: pagamento e segurança ── */}
      <div className="container footer-bottom">
        {/* Formas de pagamento aceitas — adicione/remova badges conforme necessário */}
        <div className="payment-methods">
          <h4>Formas de pagamento</h4>
          <div className="badges">
            <span className="badge">Cartão</span>
            <span className="badge">PIX</span>
            <span className="badge">Boleto</span>
          </div>
        </div>

        {/* Selos de segurança — substitua por imagens de certificados reais se desejar */}
        <div className="security">
          <h4>Compra segura</h4>
          <div className="badges">
            <span className="badge safe">HTTPS</span>
            <span className="badge safe">Dados protegidos</span>
          </div>
        </div>
      </div>

      {/* ── Nota legal do template — substitua pelo texto real da sua loja ── */}
      <div className="container footer-legal">
        <p>Template de loja virtual — personalize textos e integrações conforme seu projeto.</p>
      </div>
    </footer>
  );
}
