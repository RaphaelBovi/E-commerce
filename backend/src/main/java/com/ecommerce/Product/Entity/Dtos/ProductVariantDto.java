package com.ecommerce.Product.Entity.Dtos;

import com.ecommerce.Product.Entity.ProductVariant;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record ProductVariantDto(
        UUID id,
        String name,
        String sku,
        BigDecimal price,
        Integer qnt,
        Map<String, String> attributes
) {
    public static ProductVariantDto from(ProductVariant v) {
        return new ProductVariantDto(
                v.getId(),
                v.getName(),
                v.getSku(),
                v.getPrice(),
                v.getQnt(),
                v.getAttributes()
        );
    }
}
