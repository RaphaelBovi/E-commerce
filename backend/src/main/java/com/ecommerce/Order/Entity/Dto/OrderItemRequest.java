// ─────────────────────────────────────────────────────────────────
// OrderItemRequest.java — DTO para um item dentro da requisição de criação de pedido
//
// Representa cada produto que o cliente deseja comprar no pedido.
// É um elemento da lista "items" em CreateOrderRequest.
//
// Decisão de design: o frontend envia productName, productImage e unitPrice
// junto com o productId. Isso permite que o backend registre o snapshot
// do produto no momento da compra sem precisar fazer uma consulta extra
// ao catálogo para obter nome e imagem — preservando o histórico mesmo
// que o produto seja editado ou removido posteriormente.
//
// Para adicionar campos extras ao item (ex.: cor, tamanho):
//   1. Declare o campo aqui
//   2. Mapeie-o em OrderService ao construir o OrderItem
//   3. Adicione-o na entidade OrderItem e em OrderItemResponse
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity.Dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemRequest(
        // UUID do produto no catálogo — referência para identificação do item
        @NotNull UUID productId,

        // Nome do produto no momento da compra — copiado para preservar histórico
        @NotBlank String productName,

        // URL ou base64 da imagem — opcional (pode ser null se o produto não tiver imagem)
        String productImage,

        // Preço unitário do produto no momento da compra — obrigatório
        // O total do item será: unitPrice × quantity
        @NotNull BigDecimal unitPrice,

        // Quantidade solicitada — mínimo 1 (não faz sentido pedir 0 unidades)
        @Min(1) int quantity
) {}
