package com.ecommerce.Cart;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "shared_carts")
public class SharedCart {

    @Id
    private String token;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String itemsJson;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    public SharedCart() {}

    public SharedCart(String token, String itemsJson) {
        this.token     = token;
        this.itemsJson = itemsJson;
        this.createdAt = Instant.now();
        this.expiresAt = Instant.now().plusSeconds(60 * 60 * 24 * 7); // 7 dias
    }

    public String getToken()     { return token; }
    public String getItemsJson() { return itemsJson; }
    public Instant getCreatedAt(){ return createdAt; }
    public Instant getExpiresAt(){ return expiresAt; }

    public boolean isExpired()   { return Instant.now().isAfter(expiresAt); }
}
