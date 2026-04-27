package com.ecommerce.Shipping.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record FreightCalculateRequest(
        @NotBlank String zipCode,
        @NotEmpty List<FreightItemRequest> items
) {
    public record FreightItemRequest(UUID productId, int quantity) {}
}
