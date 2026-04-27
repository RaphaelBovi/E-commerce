package com.ecommerce.Category;

import jakarta.persistence.*;
import lombok.Getter;
import java.text.Normalizer;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "categories")
@Getter
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Category() {}

    public Category(String name) {
        this.name = name;
        this.slug = slugify(name);
    }

    public void update(String name) {
        this.name = name;
        this.slug = slugify(name);
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }

    public static String slugify(String input) {
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }
}
