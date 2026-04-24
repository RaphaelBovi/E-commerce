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

    // JPA requires a no-arg constructor. Sets safe defaults so no field is null.
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

    // Used by ProductCategoryRequest.toEntity() to create a new product.
    public ProductCategory(String name, String ref, BigDecimal price, Integer qnt,
                           String marca, String category, String image,
                           BigDecimal promotionalPrice, List<String> images) {
        this.name  = name;
        this.ref   = ref;
        this.price = price;
        this.qnt   = qnt;
        this.marca = marca;
        this.category = category;
        this.image = image;
        this.promotionalPrice = promotionalPrice;
        this.images = images != null ? images : new ArrayList<>();
    }

    // Called by ProductService.update() to apply new values to an existing product.
    public void update(String name, String ref, BigDecimal price, Integer qnt,
                       String marca, String category, String image,
                       BigDecimal promotionalPrice, List<String> images) {
        this.name  = name;
        this.ref   = ref;
        this.price = price;
        this.qnt   = qnt;
        this.marca = marca;
        this.category = category;
        this.image = image;
        this.promotionalPrice = promotionalPrice;
        this.images = images != null ? images : new ArrayList<>();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String ref;

    private BigDecimal price;

    // Promotional price — null means no active promotion.
    // isPromo = (promotionalPrice != null && promotionalPrice < price)
    @Column(name = "promotional_price")
    private BigDecimal promotionalPrice;

    private Integer qnt;
    private String marca;
    private String category;

    // Legacy single-image field kept for backward compatibility.
    @Column(columnDefinition = "TEXT")
    private String image;

    // Up to 5 product images (base64 or URLs), ordered by display priority.
    // Stored in a separate table (product_images) joined by the product UUID.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "product_images",
        joinColumns = @JoinColumn(name = "product_id")
    )
    @Column(name = "image_url", columnDefinition = "TEXT")
    @OrderColumn(name = "image_order")
    private List<String> images = new ArrayList<>();

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
