import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="footer-col">
          <h4>Central de vendas</h4>
          <p className="phone">0800 000 0000</p>
          <p>Segunda a sexta, 9h às 18h</p>
        </div>

        <div className="footer-col">
          <h4>Atendimento</h4>
          <p>(00) 0000-0000</p>
          <p>contato@sualoja.com.br</p>
        </div>

        <div className="footer-col">
          <ul className="footer-links">
            <li><a href="#conta">Minha conta</a></li>
            <li><a href="#pedidos">Meus pedidos</a></li>
            <li><a href="#privacidade">Privacidade</a></li>
            <li><a href="#trocas">Trocas e devoluções</a></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <div className="payment-methods">
          <h4>Formas de pagamento</h4>
          <div className="badges">
            <span className="badge">Cartão</span>
            <span className="badge">PIX</span>
            <span className="badge">Boleto</span>
          </div>
        </div>

        <div className="security">
          <h4>Compra segura</h4>
          <div className="badges">
            <span className="badge safe">HTTPS</span>
            <span className="badge safe">Dados protegidos</span>
          </div>
        </div>
      </div>

      <div className="container footer-legal">
        <p>Template de loja virtual — personalize marcas, textos e integrações conforme seu projeto.</p>
      </div>
    </footer>
  );
}
