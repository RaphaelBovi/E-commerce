package com.ecommerce.Coupon;

import com.ecommerce.Coupon.Dto.CreateCouponRequest;
import com.ecommerce.Coupon.Dto.CouponResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/coupons")
public class AdminCouponController {

    @Autowired
    private CouponService couponService;

    @PostMapping
    public ResponseEntity<CouponResponse> create(@Valid @RequestBody CreateCouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<CouponResponse>> listAll() {
        return ResponseEntity.ok(couponService.listAll());
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<CouponResponse> activate(@PathVariable UUID id) {
        return ResponseEntity.ok(couponService.setActive(id, true));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<CouponResponse> deactivate(@PathVariable UUID id) {
        return ResponseEntity.ok(couponService.setActive(id, false));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        couponService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
