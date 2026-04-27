package com.ecommerce.Product.Entity.Dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.Map;

public record ProductVariantRequest(
        @NotBlank String name,
        String sku,
        BigDecimal price,
        @NotNull @Min(0) Integer qnt,
        Map<String, String> attributes
) {}
