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
        UUID id,
        String userEmail,
        OrderStatus status,
        PaymentMethod paymentMethod,
        BigDecimal totalAmount,
        String trackingCode,
        String trackingUrl,
        String deliveryAddress,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt,

        // Prazo máximo para pagamento (null = sem expiração definida).
        // Presente apenas em pedidos do fluxo redirect (PIX/Boleto/PagSeguro checkout).
        // O frontend exibe contagem regressiva e o botão "Finalizar Pagamento" enquanto este prazo não vencer.
        Instant expiresAt
) {}
