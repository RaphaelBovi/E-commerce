package com.ecommerce.Payment.Dto;

import java.util.UUID;

public record CheckoutSessionResponse(
        UUID orderId,
        String paymentUrl
) {}
