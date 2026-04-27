import { useSEO } from '../hooks/useSEO';
import './PoliticaPrivacidade.css';

export default function PoliticaPrivacidade() {
  useSEO({ title: "Política de Privacidade", description: "Saiba como coletamos, usamos e protegemos seus dados pessoais em conformidade com a LGPD." });

  return (
    <main className="pp-main">
      <div className="container pp-container">
        <h1 className="pp-title">Política de Privacidade</h1>
        <p className="pp-updated">Última atualização: abril de 2025</p>

        <div className="pp-content">
          <section className="pp-section">
            <h2>1. Quem somos</h2>
            <p>
              Sua Loja é uma plataforma de comércio eletrônico que oferece produtos de qualidade
              com entrega rápida para todo o Brasil. Nesta política explicamos como tratamos
              seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section className="pp-section">
            <h2>2. Dados que coletamos</h2>
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul>
              <li><strong>Dados de cadastro:</strong> nome completo, e-mail, CPF, telefone, data de nascimento.</li>
              <li><strong>Dados de endereço:</strong> CEP, rua, número, complemento, bairro, cidade, estado.</li>
              <li><strong>Dados de pedido:</strong> itens comprados, valores, forma de pagamento, status de entrega.</li>
              <li><strong>Dados de navegação:</strong> cookies de sessão, preferências de carrinho (armazenados localmente).</li>
            </ul>
          </section>

          <section className="pp-section">
            <h2>3. Como usamos seus dados</h2>
            <ul>
              <li>Processar e entregar seus pedidos.</li>
              <li>Enviar confirmações, atualizações de status e notificações por e-mail.</li>
              <li>Melhorar nossa plataforma e personalizar sua experiência.</li>
              <li>Cumprir obrigações legais e fiscais.</li>
              <li>Prevenir fraudes e garantir a segurança da conta.</li>
            </ul>
          </section>

          <section className="pp-section">
            <h2>4. Compartilhamento de dados</h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul>
              <li><strong>Parceiros de pagamento (PagBank):</strong> para processar transações.</li>
              <li><strong>Transportadoras (Melhor Envio):</strong> para cálculo e rastreio de frete.</li>
              <li><strong>Provedores de e-mail:</strong> para envio de notificações transacionais.</li>
            </ul>
            <p>Não vendemos ou compartilhamos seus dados com terceiros para fins de marketing.</p>
          </section>

          <section className="pp-section">
            <h2>5. Seus direitos</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul>
              <li>Acessar e corrigir seus dados pessoais (em <em>Minha Conta</em>).</li>
              <li>Solicitar a exclusão da sua conta e dados (em <em>Minha Conta → Segurança</em>).</li>
              <li>Revogar o consentimento para cookies a qualquer momento.</li>
              <li>Entrar em contato com nosso DPO em <a href="mailto:privacidade@sualoja.com.br">privacidade@sualoja.com.br</a>.</li>
            </ul>
          </section>

          <section className="pp-section">
            <h2>6. Retenção de dados</h2>
            <p>
              Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas
              nesta política ou para atender obrigações legais. Após a exclusão da conta,
              dados fiscais podem ser retidos por até 5 anos conforme exige a legislação.
            </p>
          </section>

          <section className="pp-section">
            <h2>7. Cookies</h2>
            <p>
              Usamos cookies essenciais para manter sua sessão e o carrinho de compras.
              Você pode recusar cookies não essenciais no banner de consentimento ou
              limpando o armazenamento local do navegador.
            </p>
          </section>

          <section className="pp-section">
            <h2>8. Alterações nesta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos por e-mail
              em caso de mudanças significativas. Recomendamos revisar esta página regularmente.
            </p>
          </section>

          <section className="pp-section">
            <h2>9. Contato</h2>
            <p>
              Para dúvidas sobre privacidade, entre em contato:
              <br /><a href="mailto:privacidade@sualoja.com.br">privacidade@sualoja.com.br</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
