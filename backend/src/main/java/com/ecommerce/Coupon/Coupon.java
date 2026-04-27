package com.ecommerce.Coupon;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "coupons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponType type;

    // Valor do desconto: percentual (0-100) ou valor fixo em reais
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    // Pedido mínimo para ativar o cupom (null = sem mínimo)
    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    // Limite de usos totais (null = ilimitado)
    private Integer maxUsages;

    @Builder.Default
    @Column(nullable = false)
    private int usedCount = 0;

    // Data de expiração (null = sem expiração)
    private Instant expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
