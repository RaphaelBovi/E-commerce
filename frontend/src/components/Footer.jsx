import React from 'react';
import { Link } from 'react-router-dom';
import { FaStore, FaInstagram, FaFacebook, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      {/* ── Main footer ── */}
      <div className="footer-main">
        <div className="container footer-grid">

          {/* Brand column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-mark"><FaStore /></span>
              <span className="footer-logo-name">Sua Loja</span>
            </Link>
            <p className="footer-brand-desc">
              Produtos de qualidade com entrega rápida para todo o Brasil.
              Compre com segurança e confiança.
            </p>
            <div className="footer-social">
              <a href="#instagram" className="social-link" aria-label="Instagram"><FaInstagram /></a>
              <a href="#facebook" className="social-link" aria-label="Facebook"><FaFacebook /></a>
              <a href="#whatsapp" className="social-link" aria-label="WhatsApp"><FaWhatsapp /></a>
              <a href="#youtube" className="social-link" aria-label="YouTube"><FaYoutube /></a>
            </div>
          </div>

          {/* Links column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navegação</h4>
            <ul className="footer-links">
              <li><Link to="/">Início</Link></li>
              <li><Link to="/catalogo">Catálogo</Link></li>
              <li><Link to="/lancamentos">Novidades</Link></li>
              <li><Link to="/promocoes">Ofertas</Link></li>
              <li><Link to="/institucional">Sobre nós</Link></li>
            </ul>
          </div>

          {/* Account column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Minha Conta</h4>
            <ul className="footer-links">
              <li><Link to="/minha-conta">Painel</Link></li>
              <li><Link to="/minha-conta">Meus pedidos</Link></li>
              <li><Link to="/minha-conta">Endereços</Link></li>
              <li><Link to="/minha-conta">Segurança</Link></li>
              <li><Link to="/login">Entrar</Link></li>
            </ul>
          </div>

          {/* Contact column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Atendimento</h4>
            <ul className="footer-links">
              <li><span>0800 000 0000</span></li>
              <li><span>Seg–Sex, 9h às 18h</span></li>
              <li><a href="mailto:contato@sualoja.com.br">contato@sualoja.com.br</a></li>
            </ul>
            <div className="footer-payment">
              <p className="footer-payment-label">Pagamos com</p>
              <div className="footer-badges">
                <span className="foot-badge">Cartão</span>
                <span className="foot-badge">PIX</span>
                <span className="foot-badge">Boleto</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} Sua Loja. Template de e-commerce.</p>
          <div className="footer-bottom-links">
            <Link to="/politica-de-privacidade">Privacidade</Link>
            <Link to="/termos-de-uso">Termos de uso</Link>
            <a href="mailto:contato@sualoja.com.br">Trocas e devoluções</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
