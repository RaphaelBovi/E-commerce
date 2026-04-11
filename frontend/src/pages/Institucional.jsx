import React from 'react';
import './Institucional.css';

export default function Institucional() {
  return (
    <main className="container institutional-page">
      <section className="institutional-hero">
        <p className="institutional-kicker">Quem somos</p>
        <h1>
          Tradição em <span className="highlight-text">peças para linha pesada</span>
        </h1>
        <p>
          A Pastractor atua com foco em confiabilidade, agilidade no atendimento e suporte técnico para
          auxiliar empresas e profissionais na escolha de componentes críticos para manutenção.
        </p>
      </section>

      <section className="institutional-grid">
        <article className="institutional-card">
          <h3>Missão</h3>
          <p>
            Entregar peças com alto padrão de qualidade e suporte comercial especializado,
            garantindo mais produtividade para operações de campo e indústria.
          </p>
        </article>

        <article className="institutional-card">
          <h3>Visão</h3>
          <p>
            Ser referência nacional em distribuição técnica para maquinário pesado,
            mantendo relacionamento próximo e transparente com cada cliente.
          </p>
        </article>

        <article className="institutional-card">
          <h3>Valores</h3>
          <p>
            Compromisso, transparência, agilidade e responsabilidade técnica em todos os processos,
            desde o orçamento até o pós-venda.
          </p>
        </article>
      </section>

      <section className="institutional-contact">
        <h2>Atendimento comercial</h2>
        <p>
          Fale com nosso time para suporte em aplicação, disponibilidade e orçamento personalizado.
          Estamos prontos para orientar a melhor escolha para o seu equipamento.
        </p>
      </section>
    </main>
  );
}
