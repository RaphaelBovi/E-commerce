package com.ecommerce.Order.Entity.Dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID id,
        UUID productId,
        String productName,
        String productImage,
        BigDecimal unitPrice,
        int quantity
) {}
