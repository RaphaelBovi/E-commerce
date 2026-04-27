package com.ecommerce.Product.Entity;

import com.ecommerce.Product.Converter.StringMapConverter;
import com.ecommerce.Product.Exception.BusinessException;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "product_variant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductCategory product;

    @Column(nullable = false)
    private String name;

    private String sku;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer qnt;

    @Convert(converter = StringMapConverter.class)
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private Map<String, String> attributes = new HashMap<>();

    public void decrementStock(int qty) {
        if (this.qnt < qty) {
            throw new BusinessException(
                "Estoque insuficiente para variante \"" + this.name + "\". Disponível: " + this.qnt + ", solicitado: " + qty);
        }
        this.qnt -= qty;
    }

    public void incrementStock(int qty) {
        this.qnt += qty;
    }
}
