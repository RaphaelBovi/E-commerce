package com.ecommerce.Order.Entity.Dto;

import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String userEmail,
        OrderStatus status,
        PaymentMethod paymentMethod,
        BigDecimal totalAmount,
        String trackingCode,
        String deliveryAddress,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {}
