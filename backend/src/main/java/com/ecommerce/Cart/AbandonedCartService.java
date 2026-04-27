package com.ecommerce.Cart;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AbandonedCartService {

    private static final Logger log = LoggerFactory.getLogger(AbandonedCartService.class);

    @Autowired private AbandonedCartRepository repository;
    @Autowired private EmailService emailService;

    public void sync(User user, String itemsJson) {
        var cart = repository.findById(user.getId()).orElse(null);
        if (cart == null) {
            repository.save(new AbandonedCart(user.getId(), user.getEmail(), itemsJson));
        } else {
            cart.update(itemsJson);
            repository.save(cart);
        }
    }

    public void clear(User user) {
        repository.deleteById(user.getId());
    }

    // Runs every hour — finds carts idle for > 1 hour and sends a recovery email (once per abandonment)
    @Scheduled(fixedDelay = 3_600_000)
    public void sendRecoveryEmails() {
        Instant cutoff = Instant.now().minus(1, ChronoUnit.HOURS);
        List<AbandonedCart> abandoned = repository.findAbandoned(cutoff);
        for (AbandonedCart cart : abandoned) {
            try {
                emailService.sendAbandonedCartEmail(cart.getEmail());
                cart.markEmailSent();
                repository.save(cart);
                log.info("E-mail de carrinho abandonado enviado para: {}", cart.getEmail());
            } catch (Exception e) {
                log.error("Falha ao enviar e-mail de carrinho abandonado para {}: {}", cart.getEmail(), e.getMessage());
            }
        }
    }
}
