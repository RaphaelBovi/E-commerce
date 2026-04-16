// ─────────────────────────────────────────────────────────────────
// CreateOrderRequest.java — DTO para criação de um novo pedido
//
// Enviado no corpo da requisição POST /api/orders pelo cliente autenticado.
// O usuário associado ao pedido é identificado pelo JWT da requisição
// (extraído no OrderService via SecurityContextHolder), não pelo body.
//
// Validações aplicadas:
//   - paymentMethod: obrigatório — deve ser um dos valores do enum PaymentMethod
//   - deliveryAddress: obrigatório e não vazio
//   - items: lista não vazia (@NotEmpty) com validação em cascata de cada item (@Valid)
//
// Para adicionar campos extras ao pedido (ex.: cupom de desconto):
//   1. Declare o campo aqui com as validações necessárias
//   2. Mapeie-o em OrderService.createOrder()
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity.Dto;

import com.ecommerce.Order.Entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(
        // Método de pagamento escolhido pelo cliente — obrigatório
        // Deve corresponder a um valor do enum PaymentMethod (PIX, CREDIT_CARD, BOLETO, DEBIT_CARD)
        @NotNull PaymentMethod paymentMethod,

        // Endereço completo de entrega — obrigatório e não vazio
        // Copiado para o pedido no momento da criação (histórico imutável)
        @NotBlank String deliveryAddress,

        // Lista de itens do pedido — deve conter ao menos 1 item
        // @Valid garante que cada OrderItemRequest dentro da lista também seja validado
        @NotEmpty @Valid List<OrderItemRequest> items
) {}
