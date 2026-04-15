package com.ecommerce.Order.Entity.Dto;

import com.ecommerce.Order.Entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull OrderStatus status
) {}
