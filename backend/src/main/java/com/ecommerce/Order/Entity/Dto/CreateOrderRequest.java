package com.ecommerce.Order.Entity.Dto;

import com.ecommerce.Order.Entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(
        @NotNull PaymentMethod paymentMethod,
        @NotBlank String deliveryAddress,
        @NotEmpty @Valid List<OrderItemRequest> items
) {}
