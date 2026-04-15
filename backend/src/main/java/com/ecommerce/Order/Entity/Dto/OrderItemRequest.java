package com.ecommerce.Order.Entity.Dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemRequest(
        @NotNull UUID productId,
        @NotBlank String productName,
        String productImage,
        @NotNull BigDecimal unitPrice,
        @Min(1) int quantity
) {}
