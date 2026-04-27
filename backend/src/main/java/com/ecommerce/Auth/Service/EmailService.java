package com.ecommerce.Auth.Service;

import com.ecommerce.Order.Entity.Order;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    // required = false: app starts normally even without mail config (dev mode)
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@sualoja.com}")
    private String from;

    public void sendVerificationCode(String toEmail, String code) {
        if (mailSender == null) {
            // Dev fallback: print OTP to console instead of sending email
            log.warn("[DEV] E-mail não configurado — código OTP para {}: {}", toEmail, code);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Código de verificação — Sua Loja");
            helper.setText(buildHtml(code), true);
            mailSender.send(message);
            log.info("E-mail de verificação enviado para: {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Falha ao enviar e-mail para {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Não foi possível enviar o e-mail de verificação. Tente novamente.");
        }
    }

    public void sendPasswordResetCode(String toEmail, String code) {
        if (mailSender == null) {
            log.warn("[DEV] E-mail não configurado — código de redefinição para {}: {}", toEmail, code);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Redefinição de senha — Sua Loja");
            helper.setText(buildResetHtml(code), true);
            mailSender.send(message);
            log.info("E-mail de redefinição enviado para: {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Falha ao enviar e-mail de redefinição para {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Não foi possível enviar o e-mail de redefinição. Tente novamente.");
        }
    }

    public void sendOrderConfirmation(Order order) {
        String toEmail = order.getUser() != null ? order.getUser().getEmail() : order.getGuestEmail();
        if (toEmail == null || toEmail.isBlank()) return;
        if (mailSender == null) {
            log.warn("[DEV] E-mail não configurado — confirmação de pedido {} para {}", order.getId(), toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Pedido confirmado! #" + order.getId().toString().substring(0, 8).toUpperCase() + " — Sua Loja");
            helper.setText(buildOrderConfirmationHtml(order), true);
            mailSender.send(message);
            log.info("Confirmação de pedido enviada para: {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Falha ao enviar confirmação de pedido para {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendStatusUpdate(Order order) {
        String toEmail = order.getUser() != null ? order.getUser().getEmail() : order.getGuestEmail();
        if (toEmail == null || toEmail.isBlank()) return;
        if (mailSender == null) {
            log.warn("[DEV] E-mail não configurado — atualização de status {} para {}", order.getStatus(), toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject(statusSubject(order) + " — Sua Loja");
            helper.setText(buildStatusUpdateHtml(order), true);
            mailSender.send(message);
            log.info("Atualização de status {} enviada para: {}", order.getStatus(), toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Falha ao enviar atualização de status para {}: {}", toEmail, e.getMessage());
        }
    }

    private String statusSubject(Order order) {
        return switch (order.getStatus()) {
            case PREPARING -> "Seu pedido está sendo preparado";
            case SHIPPED   -> "Seu pedido foi enviado";
            case DELIVERED -> "Seu pedido foi entregue";
            case CANCELLED -> "Seu pedido foi cancelado";
            default        -> "Atualização do seu pedido";
        };
    }

    private String buildOrderConfirmationHtml(Order order) {
        String orderId = order.getId().toString().substring(0, 8).toUpperCase();
        String customerName = order.getUser() != null && order.getUser().getFullName() != null
                ? order.getUser().getFullName() : "Cliente";
        String total = "R$ " + String.format("%.2f", order.getTotalAmount()).replace(".", ",");

        StringBuilder itemsHtml = new StringBuilder();
        for (var item : order.getItems()) {
            itemsHtml.append("""
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px">%s</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:center">%d</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:right">R$ %s</td>
                </tr>
                """.formatted(
                    item.getProductName(),
                    item.getQuantity(),
                    String.format("%.2f", item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity()))).replace(".", ",")
            ));
        }

        return """
            <!DOCTYPE html><html lang="pt-BR">
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                    <tr><td style="background:#0f172a;padding:28px 40px;text-align:center">
                      <h1 style="color:#f59e0b;margin:0;font-size:22px;letter-spacing:-0.5px">Sua Loja</h1>
                    </td></tr>
                    <tr><td style="padding:40px">
                      <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Pedido confirmado!</h2>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">
                        Olá, <strong>%s</strong>! Seu pedido <strong>#%s</strong> foi recebido e está aguardando pagamento.
                      </p>
                      <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                        <tr>
                          <th style="text-align:left;color:#9ca3af;font-size:12px;text-transform:uppercase;padding-bottom:8px">Produto</th>
                          <th style="text-align:center;color:#9ca3af;font-size:12px;text-transform:uppercase;padding-bottom:8px">Qtd</th>
                          <th style="text-align:right;color:#9ca3af;font-size:12px;text-transform:uppercase;padding-bottom:8px">Total</th>
                        </tr>
                        %s
                      </table>
                      <div style="text-align:right;font-size:16px;font-weight:700;color:#111827;margin-bottom:28px">
                        Total: %s
                      </div>
                      <p style="color:#9ca3af;font-size:13px;margin:0">
                        Você receberá atualizações sobre seu pedido por e-mail.
                      </p>
                    </td></tr>
                    <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center">
                      <p style="color:#9ca3af;font-size:12px;margin:0">© 2025 Sua Loja. Todos os direitos reservados.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(customerName, orderId, itemsHtml, total);
    }

    private String buildStatusUpdateHtml(Order order) {
        String orderId = order.getId().toString().substring(0, 8).toUpperCase();
        String customerName = order.getUser() != null && order.getUser().getFullName() != null
                ? order.getUser().getFullName() : "Cliente";

        String statusMessage = switch (order.getStatus()) {
            case PREPARING -> "Seu pedido está sendo preparado e em breve será enviado.";
            case SHIPPED   -> "Seu pedido foi enviado! Em breve chegará até você.";
            case DELIVERED -> "Seu pedido foi entregue com sucesso. Obrigado pela compra!";
            case CANCELLED -> "Seu pedido foi cancelado. Em caso de dúvidas, entre em contato com nosso suporte.";
            default        -> "O status do seu pedido foi atualizado.";
        };

        String trackingSection = "";
        if (order.getStatus() == com.ecommerce.Order.Entity.OrderStatus.SHIPPED
                && order.getTrackingCode() != null) {
            String linkHtml = order.getTrackingUrl() != null
                ? "<a href=\"" + order.getTrackingUrl() + "\" style=\"color:#2563eb\">Rastrear pedido</a>"
                : "";
            trackingSection = """
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin:20px 0">
                  <p style="margin:0 0 6px;color:#1d4ed8;font-weight:700;font-size:14px">Código de rastreio</p>
                  <p style="margin:0;color:#1e40af;font-size:18px;font-family:monospace;font-weight:900;letter-spacing:2px">%s</p>
                  %s
                </div>
                """.formatted(order.getTrackingCode(), linkHtml);
        }

        return """
            <!DOCTYPE html><html lang="pt-BR">
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                    <tr><td style="background:#0f172a;padding:28px 40px;text-align:center">
                      <h1 style="color:#f59e0b;margin:0;font-size:22px;letter-spacing:-0.5px">Sua Loja</h1>
                    </td></tr>
                    <tr><td style="padding:40px">
                      <h2 style="color:#111827;font-size:20px;margin:0 0 8px">%s</h2>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px">
                        Olá, <strong>%s</strong>! Seu pedido <strong>#%s</strong> teve o status atualizado.
                      </p>
                      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0">%s</p>
                      %s
                      <p style="color:#9ca3af;font-size:13px;margin:16px 0 0">
                        Este é um e-mail automático. Não responda a esta mensagem.
                      </p>
                    </td></tr>
                    <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center">
                      <p style="color:#9ca3af;font-size:12px;margin:0">© 2025 Sua Loja. Todos os direitos reservados.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(statusSubject(order), customerName, orderId, statusMessage, trackingSection);
    }

    public void sendAbandonedCartEmail(String toEmail) {
        if (mailSender == null) {
            log.warn("[DEV] E-mail não configurado — carrinho abandonado para: {}", toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Você deixou itens no carrinho — Sua Loja");
            helper.setText(buildAbandonedCartHtml(), true);
            mailSender.send(message);
            log.info("E-mail de carrinho abandonado enviado para: {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Falha ao enviar e-mail de carrinho abandonado para {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildAbandonedCartHtml() {
        return """
            <!DOCTYPE html><html lang="pt-BR">
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
                <tr><td align="center">
                  <table width="480" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                    <tr><td style="background:#0f172a;padding:28px 40px;text-align:center">
                      <h1 style="color:#f59e0b;margin:0;font-size:22px;letter-spacing:-0.5px">Sua Loja</h1>
                    </td></tr>
                    <tr><td style="padding:40px;text-align:center">
                      <div style="font-size:48px;margin-bottom:16px">🛒</div>
                      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">Você esqueceu algo!</h2>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px">
                        Você tem itens esperando no carrinho.<br>
                        Finalize sua compra antes que esgotem!
                      </p>
                      <a href="%s" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:999px;letter-spacing:0.02em">
                        Finalizar compra
                      </a>
                      <p style="color:#9ca3af;font-size:13px;margin:28px 0 0">
                        Este é um e-mail automático. Não responda a esta mensagem.
                      </p>
                    </td></tr>
                    <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center">
                      <p style="color:#9ca3af;font-size:12px;margin:0">© 2025 Sua Loja. Todos os direitos reservados.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(System.getenv().getOrDefault("APP_FRONTEND_URL", "https://sualoja.com.br") + "/checkout");
    }

    public void sendPasswordChangedNotification(String toEmail, String fullName) {
        if (mailSender == null) {
            log.warn("[DEV] E-mail não configurado — notificação de troca de senha para: {}", toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Sua senha foi alterada — Sua Loja");
            helper.setText(buildPasswordChangedHtml(fullName), true);
            mailSender.send(message);
            log.info("Notificação de senha alterada enviada para: {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Falha ao enviar notificação de senha para {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildHtml(String code) {
        return """
            <!DOCTYPE html><html lang="pt-BR">
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
                <tr><td align="center">
                  <table width="480" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                    <tr><td style="background:#0f172a;padding:28px 40px;text-align:center">
                      <h1 style="color:#f59e0b;margin:0;font-size:22px;letter-spacing:-0.5px">Sua Loja</h1>
                    </td></tr>
                    <tr><td style="padding:40px">
                      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">Confirme seu e-mail</h2>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px">
                        Use o código abaixo para concluir seu cadastro.<br>
                        Ele é válido por <strong>10 minutos</strong>.
                      </p>
                      <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px">
                        <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#111827;font-family:monospace">%s</span>
                      </div>
                      <p style="color:#9ca3af;font-size:13px;margin:0">
                        Se você não tentou criar uma conta, ignore este e-mail com segurança.
                      </p>
                    </td></tr>
                    <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center">
                      <p style="color:#9ca3af;font-size:12px;margin:0">© 2025 Sua Loja. Todos os direitos reservados.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(code);
    }

    private String buildResetHtml(String code) {
        return """
            <!DOCTYPE html><html lang="pt-BR">
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
                <tr><td align="center">
                  <table width="480" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                    <tr><td style="background:#0f172a;padding:28px 40px;text-align:center">
                      <h1 style="color:#f59e0b;margin:0;font-size:22px;letter-spacing:-0.5px">Sua Loja</h1>
                    </td></tr>
                    <tr><td style="padding:40px">
                      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">Redefinição de senha</h2>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px">
                        Recebemos uma solicitação para redefinir a senha da sua conta.<br>
                        Use o código abaixo — ele é válido por <strong>15 minutos</strong>.
                      </p>
                      <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px">
                        <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#111827;font-family:monospace">%s</span>
                      </div>
                      <p style="color:#9ca3af;font-size:13px;margin:0">
                        Se você não solicitou a redefinição de senha, ignore este e-mail com segurança.
                        Sua senha permanecerá a mesma.
                      </p>
                    </td></tr>
                    <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center">
                      <p style="color:#9ca3af;font-size:12px;margin:0">© 2025 Sua Loja. Todos os direitos reservados.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(code);
    }

    private String buildPasswordChangedHtml(String fullName) {
        String name = (fullName != null && !fullName.isBlank()) ? fullName : "Cliente";
        return """
            <!DOCTYPE html><html lang="pt-BR">
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
                <tr><td align="center">
                  <table width="480" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                    <tr><td style="background:#0f172a;padding:28px 40px;text-align:center">
                      <h1 style="color:#f59e0b;margin:0;font-size:22px;letter-spacing:-0.5px">Sua Loja</h1>
                    </td></tr>
                    <tr><td style="padding:40px">
                      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">Senha alterada com sucesso</h2>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px">
                        Olá, <strong>%s</strong>!
                      </p>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px">
                        A senha da sua conta foi alterada com sucesso em %s.
                        Agora você pode entrar com a nova senha.
                      </p>
                      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:28px">
                        <p style="color:#b91c1c;font-size:14px;line-height:1.6;margin:0;font-weight:600">
                          ⚠️ Não foi você?
                        </p>
                        <p style="color:#b91c1c;font-size:14px;line-height:1.6;margin:8px 0 0">
                          Se você não realizou essa alteração, entre em contato com nosso suporte
                          imediatamente ou acesse o site agora e redefina sua senha para proteger
                          sua conta.
                        </p>
                      </div>
                      <p style="color:#9ca3af;font-size:13px;margin:0">
                        Este é um e-mail automático. Não responda a esta mensagem.
                      </p>
                    </td></tr>
                    <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center">
                      <p style="color:#9ca3af;font-size:12px;margin:0">© 2025 Sua Loja. Todos os direitos reservados.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(name, java.time.format.DateTimeFormatter
                .ofPattern("dd/MM/yyyy 'às' HH:mm")
                .withZone(java.time.ZoneId.of("America/Sao_Paulo"))
                .format(java.time.Instant.now()));
    }
}
