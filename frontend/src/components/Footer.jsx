import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="footer-col">
          <h4>Compre pelo telefone</h4>
          <p className="phone">0800 591 3003</p>
          <p>Segunda a sexta das 8h às 18h</p>
        </div>

        <div className="footer-col">
          <h4>Atendimento</h4>
          <p>(41) 3386-8180</p>
          <p>0800 591 3003</p>
          <p>loja@pastractor.com.br</p>
        </div>

        <div className="footer-col">
          <ul className="footer-links">
            <li><a href="#conta">Minha Conta</a></li>
            <li><a href="#pedidos">Meus Pedidos</a></li>
            <li><a href="#privacidade">Política de Privacidade</a></li>
            <li><a href="#trocas">Trocas e devoluções</a></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <div className="payment-methods">
          <h4>Formas de pagamento</h4>
          <div className="badges">
            <span className="badge">Visa</span>
            <span className="badge">Master</span>
            <span className="badge">PIX</span>
          </div>
        </div>

        <div className="security">
          <h4>Compra 100% segura</h4>
          <div className="badges">
            <span className="badge safe">SSL Blindado</span>
            <span className="badge safe">Site Seguro</span>
          </div>
        </div>
      </div>
    </footer>
  );
}