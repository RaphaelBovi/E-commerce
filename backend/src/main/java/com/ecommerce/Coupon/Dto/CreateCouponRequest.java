package com.ecommerce.Coupon.Dto;

import com.ecommerce.Coupon.CouponType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateCouponRequest(
        @NotBlank @Size(min = 3, max = 32) String code,
        @NotNull CouponType type,
        @NotNull @Positive BigDecimal value,
        BigDecimal minOrderAmount,
        Integer maxUsages,
        Instant expiresAt
) {}
