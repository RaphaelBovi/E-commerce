// ─────────────────────────────────────────────────────────────────
// OrderItemResponse.java — DTO de saída para um item de pedido
//
// Representa um item individual dentro da resposta de um pedido (OrderResponse).
// Contém todos os dados do item necessários para o frontend exibir
// o detalhamento dos produtos comprados: nome, imagem, preço e quantidade.
//
// Para adicionar campos extras na resposta de item (ex.: subtotal calculado):
//   1. Declare o campo aqui
//   2. Mapeie-o em OrderService ao montar o OrderItemResponse a partir de OrderItem
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity.Dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        // Identificador único do item (UUID gerado pelo banco)
        UUID id,

        // UUID do produto original no catálogo (referência fraca — produto pode ter sido excluído)
        UUID productId,

        // Nome do produto registrado no momento da compra
        String productName,

        // URL ou base64 da imagem do produto registrada no momento da compra
        String productImage,

        // Preço unitário cobrado no momento da compra
        BigDecimal unitPrice,

        // Quantidade adquirida deste produto no pedido
        int quantity
) {}
