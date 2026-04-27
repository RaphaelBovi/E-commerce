package com.ecommerce.Coupon;

import com.ecommerce.Coupon.Dto.CouponValidateRequest;
import com.ecommerce.Coupon.Dto.CouponValidateResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponService couponService;

    // POST /api/coupons/validate — valida um cupom sem aplicá-lo (para exibir o desconto no frontend)
    @PostMapping("/validate")
    public ResponseEntity<CouponValidateResponse> validate(@Valid @RequestBody CouponValidateRequest request) {
        return ResponseEntity.ok(couponService.validate(request));
    }
}
