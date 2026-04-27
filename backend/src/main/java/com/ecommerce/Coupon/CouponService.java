package com.ecommerce.Coupon;

import com.ecommerce.Coupon.Dto.CreateCouponRequest;
import com.ecommerce.Coupon.Dto.CouponResponse;
import com.ecommerce.Coupon.Dto.CouponValidateRequest;
import com.ecommerce.Coupon.Dto.CouponValidateResponse;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    // ── ADMIN: CRIAR CUPOM ────────────────────────────────────────
    public CouponResponse create(CreateCouponRequest req) {
        if (couponRepository.existsByCodeIgnoreCase(req.code())) {
            throw new BusinessException("Já existe um cupom com o código \"" + req.code() + "\"");
        }
        Coupon coupon = Coupon.builder()
                .code(req.code().toUpperCase())
                .type(req.type())
                .value(req.value())
                .minOrderAmount(req.minOrderAmount())
                .maxUsages(req.maxUsages())
                .expiresAt(req.expiresAt())
                .build();
        return toResponse(couponRepository.save(coupon));
    }

    // ── ADMIN: LISTAR TODOS ───────────────────────────────────────
    public List<CouponResponse> listAll() {
        return couponRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    // ── ADMIN: ATIVAR / DESATIVAR ─────────────────────────────────
    public CouponResponse setActive(UUID id, boolean active) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cupom não encontrado"));
        coupon.setActive(active);
        return toResponse(couponRepository.save(coupon));
    }

    // ── ADMIN: DELETAR ────────────────────────────────────────────
    public void delete(UUID id) {
        if (!couponRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cupom não encontrado");
        }
        couponRepository.deleteById(id);
    }

    // ── PÚBLICO: VALIDAR ──────────────────────────────────────────
    public CouponValidateResponse validate(CouponValidateRequest req) {
        Coupon coupon = findValidCoupon(req.code(), req.orderAmount());
        BigDecimal discount = calculateDiscount(coupon, req.orderAmount());
        BigDecimal finalAmount = req.orderAmount().subtract(discount).max(BigDecimal.ZERO);
        return new CouponValidateResponse(coupon.getCode(), coupon.getType(),
                coupon.getValue(), discount, finalAmount);
    }

    // ── INTERNO: APLICAR (chamado pelo PaymentService) ────────────
    // Valida e decrementa o contador de usos atomicamente.
    @Transactional
    public BigDecimal applyCoupon(String code, BigDecimal orderAmount) {
        Coupon coupon = findValidCoupon(code, orderAmount);
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);
        return calculateDiscount(coupon, orderAmount);
    }

    private Coupon findValidCoupon(String code, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new BusinessException("Cupom \"" + code + "\" não encontrado"));

        if (!coupon.isActive()) {
            throw new BusinessException("Este cupom não está mais ativo");
        }
        if (coupon.getExpiresAt() != null && Instant.now().isAfter(coupon.getExpiresAt())) {
            throw new BusinessException("Este cupom expirou");
        }
        if (coupon.getMaxUsages() != null && coupon.getUsedCount() >= coupon.getMaxUsages()) {
            throw new BusinessException("Este cupom atingiu o limite de usos");
        }
        if (coupon.getMinOrderAmount() != null && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new BusinessException("Pedido mínimo para este cupom: R$ " +
                    String.format("%.2f", coupon.getMinOrderAmount()).replace(".", ","));
        }
        return coupon;
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal orderAmount) {
        if (coupon.getType() == CouponType.PERCENT) {
            return orderAmount.multiply(coupon.getValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return coupon.getValue().min(orderAmount);
    }

    private CouponResponse toResponse(Coupon c) {
        return new CouponResponse(c.getId(), c.getCode(), c.getType(), c.getValue(),
                c.getMinOrderAmount(), c.getMaxUsages(), c.getUsedCount(),
                c.getExpiresAt(), c.isActive(), c.getCreatedAt());
    }
}
