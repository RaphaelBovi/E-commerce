// ─────────────────────────────────────────────────────────────────
// UpdateOrderStatusRequest.java — DTO para atualização de status de pedido
//
// Enviado no corpo da requisição PATCH /api/orders/{id}/status por
// administradores para avançar o status de um pedido no fluxo de entrega.
//
// Contém apenas o novo status desejado. Validações de transição de
// status (ex.: impedir mudar de DELIVERED para PENDING_PAYMENT) devem
// ser implementadas em OrderService se necessário.
//
// Para adicionar dados extras na atualização (ex.: código de rastreio ao marcar SHIPPED):
//   1. Declare o campo aqui com as validações necessárias
//   2. Mapeie-o em OrderService.updateStatus()
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity.Dto;

import com.ecommerce.Order.Entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull OrderStatus status,
        String trackingCode,
        String trackingUrl
) {}
