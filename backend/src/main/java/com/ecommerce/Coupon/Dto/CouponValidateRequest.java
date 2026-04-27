package com.ecommerce.Coupon.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CouponValidateRequest(
        @NotBlank String code,
        @NotNull @Positive BigDecimal orderAmount
) {}
