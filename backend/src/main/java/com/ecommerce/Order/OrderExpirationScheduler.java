package com.ecommerce.Order;

import com.ecommerce.Auth.Service.EmailService;
import com.ecommerce.Order.Entity.Order;
import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

// Cancela automaticamente pedidos PENDING_PAYMENT que ultrapassaram o prazo de 24h.
// Executa a cada 30 minutos para manter a base limpa sem impacto perceptível no usuário.
@Component
@Slf4j
@RequiredArgsConstructor
public class OrderExpirationScheduler {

    private final OrderRepository orderRepository;
    private final EmailService emailService;

    @Scheduled(fixedDelay = 30 * 60 * 1_000) // 30 minutos
    @Transactional
    public void cancelExpiredOrders() {
        List<Order> expired = orderRepository.findExpiredPendingPaymentOrders(Instant.now());
        if (expired.isEmpty()) return;

        log.info("Expirando {} pedido(s) com pagamento pendente...", expired.size());

        for (Order order : expired) {
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            try {
                emailService.sendStatusUpdate(order);
            } catch (Exception e) {
                log.warn("Falha ao notificar cancelamento do pedido {}: {}", order.getId(), e.getMessage());
            }
        }

        log.info("{} pedido(s) cancelado(s) por expiração do prazo de pagamento.", expired.size());
    }
}
