// ─────────────────────────────────────────────────────────────────
// OrderResponse.java — DTO de saída com os dados completos de um pedido
//
// Retornado como resposta JSON pelos endpoints de pedido:
//   - POST /api/orders              → pedido recém-criado
//   - GET  /api/orders              → lista de pedidos (admin) ou pedidos do usuário
//   - GET  /api/orders/{id}         → pedido específico
//   - PATCH /api/orders/{id}/status → pedido com status atualizado
//
// Inclui a lista completa de itens (OrderItemResponse) e identifica
// o dono do pedido pelo e-mail (userEmail), sem expor o UUID do usuário
// diretamente ao frontend.
//
// Para adicionar campos extras na resposta de pedido (ex.: número sequencial):
//   1. Declare o campo aqui
//   2. Mapeie-o em OrderService ao construir o OrderResponse
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity.Dto;

import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        // Identificador único do pedido
        UUID id,

        // E-mail do usuário que realizou o pedido — útil para o painel administrativo
        String userEmail,

        // Status atual do pedido (ex.: PENDING_PAYMENT, SHIPPED, DELIVERED)
        OrderStatus status,

        // Método de pagamento escolhido (PIX, CREDIT_CARD, BOLETO, DEBIT_CARD)
        PaymentMethod paymentMethod,

        // Valor total do pedido (soma de unitPrice × quantity de todos os itens)
        BigDecimal totalAmount,

        String trackingCode,
        String trackingUrl,
        String deliveryAddress,

        // Lista de itens do pedido com nome, imagem, preço e quantidade de cada produto
        List<OrderItemResponse> items,

        // Data e hora de criação do pedido em UTC (ISO-8601)
        Instant createdAt,

        // Data e hora da última atualização do pedido (ex.: quando o status foi alterado)
        Instant updatedAt
) {}
