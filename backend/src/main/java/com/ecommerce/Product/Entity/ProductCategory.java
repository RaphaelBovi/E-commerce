package com.ecommerce.Product.Entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.ecommerce.Product.Exception.BusinessException;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "product_category")
@Getter
public class ProductCategory {

    protected ProductCategory() {
        this.name  = "";
        this.ref   = "";
        this.price = BigDecimal.ZERO;
        this.qnt   = 0;
        this.marca = "";
        this.category = "";
        this.image = "";
        this.images = new ArrayList<>();
    }

    public ProductCategory(String name, String ref, BigDecimal price, Integer qnt,
                           String marca, String category, String image,
                           BigDecimal promotionalPrice, List<String> images,
                           BigDecimal weightKg, Integer widthCm, Integer heightCm, Integer lengthCm) {
        this.name  = name;
        this.ref   = ref;
        this.price = price;
        this.qnt   = qnt;
        this.marca = marca;
        this.category = category;
        this.image = image;
        this.promotionalPrice = promotionalPrice;
        this.images = images != null ? images : new ArrayList<>();
        this.weightKg = weightKg;
        this.widthCm  = widthCm;
        this.heightCm = heightCm;
        this.lengthCm = lengthCm;
    }

    public void update(String name, String ref, BigDecimal price, Integer qnt,
                       String marca, String category, String image,
                       BigDecimal promotionalPrice, List<String> images,
                       BigDecimal weightKg, Integer widthCm, Integer heightCm, Integer lengthCm) {
        this.name  = name;
        this.ref   = ref;
        this.price = price;
        this.qnt   = qnt;
        this.marca = marca;
        this.category = category;
        this.image = image;
        this.promotionalPrice = promotionalPrice;
        this.images = images != null ? images : new ArrayList<>();
        this.weightKg = weightKg;
        this.widthCm  = widthCm;
        this.heightCm = heightCm;
        this.lengthCm = lengthCm;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String ref;
    private BigDecimal price;

    @Column(name = "promotional_price")
    private BigDecimal promotionalPrice;

    private Integer qnt;
    private String marca;
    private String category;

    @Column(columnDefinition = "TEXT")
    private String image;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    @OrderColumn(name = "image_order")
    private List<String> images = new ArrayList<>();

    // Shipping dimensions — nullable, fallback to defaults in FreightService
    @Column(name = "weight_kg", precision = 8, scale = 3)
    private BigDecimal weightKg;

    @Column(name = "width_cm")
    private Integer widthCm;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "length_cm")
    private Integer lengthCm;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public void decrementStock(int qty) {
        if (this.qnt < qty) {
            throw new BusinessException(
                "Estoque insuficiente para \"" + this.name + "\". Disponível: " + this.qnt + ", solicitado: " + qty);
        }
        this.qnt -= qty;
    }

    public void incrementStock(int qty) {
        this.qnt += qty;
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
