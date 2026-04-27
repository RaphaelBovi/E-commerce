package com.ecommerce.Coupon.Dto;

import com.ecommerce.Coupon.CouponType;

import java.math.BigDecimal;

public record CouponValidateResponse(
        String code,
        CouponType type,
        BigDecimal discountValue,   // percentual ou valor fixo conforme type
        BigDecimal discountAmount,  // valor em reais que será deduzido do total
        BigDecimal finalAmount      // total após desconto
) {}
