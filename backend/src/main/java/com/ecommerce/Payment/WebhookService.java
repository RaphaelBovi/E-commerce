package com.ecommerce.Payment;

import com.ecommerce.Auth.Service.EmailService;
import com.ecommerce.Order.Entity.Order;
import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Processa eventos assíncronos recebidos dos gateways de pagamento.
 * Separado do PaymentService para isolar a lógica de webhook e facilitar testes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final OrderRepository orderRepository;
    private final StockService stockService;
    private final EmailService emailService;
    private final MercadoPagoService mercadoPagoService;

    // ── PAGSEGURO ─────────────────────────────────────────────────
    @Transactional
    public void handlePagSeguro(Map<String, Object> payload) {
        String chargeId    = (String) payload.get("id");
        String status      = (String) payload.get("status");
        String referenceId = (String) payload.get("reference_id");

        if (referenceId == null || status == null) return;

        try {
            UUID orderId = UUID.fromString(referenceId);
            orderRepository.findById(orderId).ifPresent(order -> {
                if (chargeId != null) order.setPagseguroChargeId(chargeId);

                boolean wasFirstConfirmation = false;

                if ("PAID".equals(status) || "AUTHORIZED".equals(status)) {
                    if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
                        stockService.decrementStock(order.getItems());
                        wasFirstConfirmation = true;
                    }
                    order.setStatus(OrderStatus.PAID);
                } else if ("DECLINED".equals(status) && order.getStatus() == OrderStatus.PENDING_PAYMENT) {
                    order.setStatus(OrderStatus.CANCELLED);
                }

                Order saved = orderRepository.save(order);
                log.info("Webhook PagSeguro: pedido {} → {}", orderId, order.getStatus());

                if (wasFirstConfirmation) {
                    trySendConfirmation(saved);
                }
            });
        } catch (IllegalArgumentException e) {
            log.warn("reference_id inválido no webhook PagSeguro: {}", referenceId);
        }
    }

    // ── MERCADO PAGO ──────────────────────────────────────────────
    @Transactional
    public void handleMercadoPago(String paymentId) {
        MercadoPagoService.MpPaymentDetails details = mercadoPagoService.getPaymentDetails(paymentId);
        if (details == null || details.externalReference() == null) return;

        try {
            UUID orderId = UUID.fromString(details.externalReference());
            orderRepository.findById(orderId).ifPresent(order -> {
                boolean wasFirstConfirmation = false;
                String status = details.status();

                if ("approved".equals(status)) {
                    if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
                        stockService.decrementStock(order.getItems());
                        wasFirstConfirmation = true;
                    }
                    order.setStatus(OrderStatus.PAID);
                } else if ("rejected".equals(status) || "cancelled".equals(status)) {
                    if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
                        order.setStatus(OrderStatus.CANCELLED);
                    }
                }

                Order saved = orderRepository.save(order);
                log.info("Webhook Mercado Pago: pedido {} → {}", orderId, order.getStatus());

                if (wasFirstConfirmation) {
                    trySendConfirmation(saved);
                }
            });
        } catch (IllegalArgumentException e) {
            log.warn("externalReference inválido no webhook Mercado Pago: {}", details.externalReference());
        }
    }

    private void trySendConfirmation(Order order) {
        try {
            emailService.sendOrderConfirmation(order);
        } catch (Exception e) {
            log.warn("Falha ao enviar e-mail de confirmação via webhook: {}", e.getMessage());
        }
    }
}
