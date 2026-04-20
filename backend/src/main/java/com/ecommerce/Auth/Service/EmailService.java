package com.ecommerce.Auth.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
        } catch (MessagingException e) {
            log.error("Falha ao enviar e-mail para {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Não foi possível enviar o e-mail de verificação. Tente novamente.");
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
}
