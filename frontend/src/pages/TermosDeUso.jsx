import { useSEO } from '../hooks/useSEO';
import './PoliticaPrivacidade.css';

export default function TermosDeUso() {
  useSEO({ title: "Termos de Uso", description: "Leia os termos e condições de uso da nossa plataforma de e-commerce." });

  return (
    <main className="pp-main">
      <div className="container pp-container">
        <h1 className="pp-title">Termos de Uso</h1>
        <p className="pp-updated">Última atualização: abril de 2025</p>

        <div className="pp-content">
          <section className="pp-section">
            <h2>1. Aceitação dos termos</h2>
            <p>
              Ao acessar ou usar nossa plataforma, você concorda com estes Termos de Uso.
              Se não concordar, não utilize nossos serviços.
            </p>
          </section>

          <section className="pp-section">
            <h2>2. Uso da plataforma</h2>
            <p>Você concorda em usar a plataforma apenas para fins lícitos e se compromete a:</p>
            <ul>
              <li>Fornecer informações verdadeiras e atualizadas no cadastro.</li>
              <li>Não realizar tentativas de fraude, chargeback indevido ou abuso de cupons.</li>
              <li>Não utilizar meios automatizados para acessar nossa plataforma sem autorização.</li>
              <li>Manter a confidencialidade de suas credenciais de acesso.</li>
            </ul>
          </section>

          <section className="pp-section">
            <h2>3. Produtos e preços</h2>
            <p>
              Todos os preços são em Reais (BRL) e incluem os impostos aplicáveis.
              Reservamo-nos o direito de alterar preços a qualquer momento sem aviso prévio,
              mas pedidos já confirmados serão cobrados pelo preço no momento da compra.
            </p>
          </section>

          <section className="pp-section">
            <h2>4. Pagamento</h2>
            <p>
              Aceitamos pagamentos via cartão de crédito, Pix e boleto bancário, processados
              pelo PagBank. O pedido é confirmado somente após aprovação do pagamento.
            </p>
          </section>

          <section className="pp-section">
            <h2>5. Entrega</h2>
            <p>
              Os prazos de entrega são estimativos e podem variar conforme a localização e
              a transportadora. Não nos responsabilizamos por atrasos causados por fatores
              externos (greves, catástrofes, etc.).
            </p>
          </section>

          <section className="pp-section">
            <h2>6. Trocas e devoluções</h2>
            <p>
              Conforme o Código de Defesa do Consumidor (Art. 49), você tem direito a
              desistência em até 7 dias corridos após o recebimento. Entre em contato pelo
              suporte para iniciar o processo.
            </p>
          </section>

          <section className="pp-section">
            <h2>7. Propriedade intelectual</h2>
            <p>
              Todo o conteúdo desta plataforma (textos, imagens, logotipos, código) é de
              propriedade exclusiva da Sua Loja e não pode ser reproduzido sem autorização.
            </p>
          </section>

          <section className="pp-section">
            <h2>8. Limitação de responsabilidade</h2>
            <p>
              Não nos responsabilizamos por danos indiretos, incidentais ou consequentes
              decorrentes do uso da plataforma, exceto nos limites previstos pelo CDC.
            </p>
          </section>

          <section className="pp-section">
            <h2>9. Alterações nos termos</h2>
            <p>
              Podemos atualizar estes termos periodicamente. O uso continuado após as
              alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="pp-section">
            <h2>10. Contato</h2>
            <p>
              Dúvidas sobre estes termos: <a href="mailto:contato@sualoja.com.br">contato@sualoja.com.br</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
