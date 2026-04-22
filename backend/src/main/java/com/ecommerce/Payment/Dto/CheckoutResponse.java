package com.ecommerce.Payment.Dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CheckoutResponse(

        // UUID of the order created in the system
        UUID orderId,

        // PagSeguro charge ID — null when payment was not processed
        String chargeId,

        // PagSeguro charge status: PAID | IN_ANALYSIS | DECLINED | ERROR
        String paymentStatus,

        // Total amount charged
        BigDecimal totalAmount,

        // true = order accepted (PAID or IN_ANALYSIS); false = declined/error
        boolean success,

        // Human-readable message for the frontend to display
        String message
) {}
