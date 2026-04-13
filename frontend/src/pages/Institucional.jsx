import React from 'react';
import './Institucional.css';

export default function Institucional() {
  return (
    <main className="container institutional-page">
      <section className="institutional-hero">
        <p className="institutional-kicker">Institucional</p>
        <h1>
          Uma vitrine <span className="highlight-text">moderna</span> para o seu e-commerce
        </h1>
        <p>
          Esta página é um modelo: substitua os textos pela história da sua marca, diferenciais e informações
          de contato. O layout prioriza leitura clara e confiança — ideais para lojas que vendem online.
        </p>
      </section>

      <section className="institutional-grid">
        <article className="institutional-card">
          <h3>Missão</h3>
          <p>
            Oferecer uma experiência de compra simples, com informações transparentes e suporte acessível
            em todas as etapas do pedido.
          </p>
        </article>

        <article className="institutional-card">
          <h3>Visão</h3>
          <p>
            Ser reconhecido pela qualidade do serviço, pela curadoria de produtos e pela confiança
            construída com clientes e parceiros.
          </p>
        </article>

        <article className="institutional-card">
          <h3>Valores</h3>
          <p>
            Ética, respeito ao consumidor, melhoria contínua e foco na satisfação — pilares que você pode
            adaptar ao posicionamento da sua empresa.
          </p>
        </article>
      </section>

      <section className="institutional-contact">
        <h2>Fale conosco</h2>
        <p>
          Inclua horários de atendimento, canais preferenciais e, se desejar, um formulário ou mapa.
          Personalize este bloco para refletir o relacionamento da sua loja com o cliente.
        </p>
      </section>
    </main>
  );
}
