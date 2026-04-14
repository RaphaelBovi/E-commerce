package com.ecommerce.Product.Entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "product_category")
@Getter
public class ProductCategory {

    protected ProductCategory() {
        this.name = "";
        this.ref = "";
        this.price = BigDecimal.ZERO;
        this.qnt = 0;
        this.marca = "";
        this.category = "";
        this.image = "";
    }

    public ProductCategory(String name, String ref, BigDecimal price, Integer qnt, String marca, String category,
            String image) {
        this.name = name;
        this.ref = ref;
        this.price = price;
        this.qnt = qnt;
        this.marca = marca;
        this.category = category;
        this.image = image;
    }

    public void update(String name, String ref, BigDecimal price, Integer qnt, String marca, String category,
            String image) {
        this.name = name;
        this.ref = ref;
        this.price = price;
        this.qnt = qnt;
        this.marca = marca;
        this.category = category;
        this.image = image;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;

    private String ref;

    private BigDecimal price;

    private Integer qnt;

    private String marca;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String image;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

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
