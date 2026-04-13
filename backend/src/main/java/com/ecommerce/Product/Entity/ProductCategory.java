package com.ecommerce.Product.Entity;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "product_category")
@Getter
public class ProductCategory {

    protected ProductCategory() {
        this.id = UUID.randomUUID();
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

    @Column(name = "id")
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name")
    private String name;

    @Column(name = "ref")
    private String ref;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "qnt")
    private Integer qnt;

    @Column(name = "marca")
    private String marca;

    @Column(name = "category")
    private String category;

    @Column(name = "image", columnDefinition = "TEXT")
    private String image;
}
