package com.ecommerce.Coupon.Dto;

import com.ecommerce.Coupon.CouponType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CouponResponse(
        UUID id,
        String code,
        CouponType type,
        BigDecimal value,
        BigDecimal minOrderAmount,
        Integer maxUsages,
        int usedCount,
        Instant expiresAt,
        boolean active,
        Instant createdAt
) {}
