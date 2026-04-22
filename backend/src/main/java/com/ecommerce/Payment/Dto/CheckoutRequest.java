package com.ecommerce.Payment.Dto;

import com.ecommerce.Order.Entity.Dto.OrderItemRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record CheckoutRequest(

        // Card data encrypted client-side by PagSeguro JS SDK
        @NotBlank String encryptedCard,

        // Cardholder name as printed on the card
        @NotBlank String holderName,

        // Number of installments (1–12)
        @Min(1) @Max(12) int installments,

        // Full delivery address string (formatted by the frontend)
        @NotBlank String deliveryAddress,

        // Cart items — at least one required; each item is validated individually
        @NotEmpty @Valid List<OrderItemRequest> items
) {}
