import React from 'react';
import {
  FaBullseye, FaEye, FaHeart,
  FaTruck, FaHeadset, FaShieldAlt, FaUndo,
  FaUsers, FaStar, FaShoppingBag, FaCheckCircle,
  FaWhatsapp, FaEnvelope, FaClock, FaMapMarkerAlt,
} from 'react-icons/fa';
import './Institucional.css';

// ─── Dados de conteúdo (personalize para sua empresa) ─────────────

const MVV = [
  {
    Icon: FaBullseye,
    title: 'Missão',
    text: 'Oferecer uma experiência de compra simples, com informações transparentes e suporte acessível em todas as etapas do pedido.',
  },
  {
    Icon: FaEye,
    title: 'Visão',
    text: 'Ser reconhecido pela qualidade do serviço, pela curadoria de produtos e pela confiança construída com clientes e parceiros.',
  },
  {
    Icon: FaHeart,
    title: 'Valores',
    text: 'Ética, respeito ao consumidor, melhoria contínua e foco na satisfação — pilares que norteiam cada decisão da nossa loja.',
  },
];

const STATS = [
  { Icon: FaUsers,       value: '2.000+', label: 'Clientes atendidos' },
  { Icon: FaShoppingBag, value: '5.000+', label: 'Pedidos entregues' },
  { Icon: FaStar,        value: '4,8',    label: 'Avaliação média' },
  { Icon: FaCheckCircle, value: '99%',    label: 'Satisfação garantida' },
];

const BENEFITS = [
  {
    Icon: FaTruck,
    title: 'Entrega rápida',
    text: 'Frete grátis em pedidos acima de R$ 299 para todo o Brasil, com rastreamento em tempo real.',
  },
  {
    Icon: FaHeadset,
    title: 'Suporte humanizado',
    text: 'Equipe disponível para atender suas dúvidas e garantir a melhor experiência de compra.',
  },
  {
    Icon: FaShieldAlt,
    title: 'Compra segura',
    text: 'Dados criptografados, ambiente certificado e pagamentos processados com máxima segurança.',
  },
  {
    Icon: FaUndo,
    title: 'Trocas facilitadas',
    text: 'Política de trocas e devoluções clara, sem burocracia, porque sua satisfação é prioridade.',
  },
];

const CHANNELS = [
  {
    Icon: FaWhatsapp,
    title: 'WhatsApp',
    info: '(11) 99999-0000',
    sub: 'Seg – Sex, 9h às 18h',
    href: 'https://wa.me/5511999990000',
    accent: true,
  },
  {
    Icon: FaEnvelope,
    title: 'E-mail',
    info: 'contato@sualoja.com.br',
    sub: 'Resposta em até 24h',
    href: 'mailto:contato@sualoja.com.br',
  },
  {
    Icon: FaClock,
    title: 'Atendimento',
    info: 'Seg – Sex: 9h às 18h',
    sub: 'Sábados: 9h às 13h',
  },
  {
    Icon: FaMapMarkerAlt,
    title: 'Localização',
    info: 'São Paulo – SP',
    sub: 'Atendimento online',
  },
];

// ─────────────────────────────────────────────────────────────────

export default function Institucional() {
  return (
    <main className="container inst-page">

      {/* ── Hero ── */}
      <section className="inst-hero">
        <p className="inst-kicker">Institucional</p>
        <h1>
          Uma vitrine <span className="inst-highlight">moderna</span>{' '}
          para o seu e-commerce
        </h1>
        <p className="inst-hero-desc">
          Esta página é um modelo: substitua pelos textos da sua empresa, diferenciais e
          informações de contato. O layout prioriza leitura clara e confiança.
        </p>
      </section>

      {/* ── Missão / Visão / Valores ── */}
      <section className="inst-section">
        <div className="inst-section-header">
          <div className="inst-section-header-left">
            <div>
              <h2>Quem somos</h2>
              <p className="inst-section-sub">Os princípios que guiam nosso trabalho</p>
            </div>
          </div>
        </div>
        <div className="inst-mvv-grid">
          {MVV.map(({ Icon, title, text }) => (
            <article key={title} className="inst-mvv-card">
              <div className="inst-mvv-icon"><Icon aria-hidden /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="inst-stats-bar">
        {STATS.map(({ Icon, value, label }) => (
          <div key={label} className="inst-stat">
            <div className="inst-stat-icon"><Icon aria-hidden /></div>
            <span className="inst-stat-value">{value}</span>
            <span className="inst-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Por que nos escolher ── */}
      <section className="inst-section">
        <div className="inst-section-header">
          <div className="inst-section-header-left">
            <div>
              <h2>Por que nos escolher</h2>
              <p className="inst-section-sub">Compromissos que fazem a diferença</p>
            </div>
          </div>
        </div>
        <div className="inst-benefits-grid">
          {BENEFITS.map(({ Icon, title, text }) => (
            <div key={title} className="inst-benefit-card">
              <div className="inst-benefit-icon"><Icon aria-hidden /></div>
              <div>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contato ── */}
      <section className="inst-section">
        <div className="inst-section-header">
          <div className="inst-section-header-left">
            <div>
              <h2>Fale conosco</h2>
              <p className="inst-section-sub">Escolha o canal mais conveniente para você</p>
            </div>
          </div>
        </div>
        <div className="inst-channels-grid">
          {CHANNELS.map(({ Icon, title, info, sub, href, accent }) => {
            const content = (
              <>
                <div className={`inst-channel-icon ${accent ? 'accent' : ''}`}>
                  <Icon aria-hidden />
                </div>
                <div className="inst-channel-text">
                  <strong>{title}</strong>
                  <span className="inst-channel-info">{info}</span>
                  <span className="inst-channel-sub">{sub}</span>
                </div>
              </>
            );
            return href ? (
              <a key={title} href={href} className="inst-channel-card inst-channel-link" target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <div key={title} className="inst-channel-card">
                {content}
              </div>
            );
          })}
        </div>
      </section>

    </main>
  );
}
