package com.ecommerce.Cart;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "abandoned_carts")
public class AbandonedCart {

    @Id
    private UUID userId;

    @Column(nullable = false)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String itemsJson;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant emailSentAt;

    public AbandonedCart() {}

    public AbandonedCart(UUID userId, String email, String itemsJson) {
        this.userId = userId;
        this.email = email;
        this.itemsJson = itemsJson;
        this.updatedAt = Instant.now();
    }

    public UUID getUserId()       { return userId; }
    public String getEmail()      { return email; }
    public String getItemsJson()  { return itemsJson; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getEmailSentAt() { return emailSentAt; }

    public void update(String itemsJson) {
        this.itemsJson = itemsJson;
        this.updatedAt = Instant.now();
        this.emailSentAt = null; // reset — cart changed, send again if abandoned
    }

    public void markEmailSent() {
        this.emailSentAt = Instant.now();
    }
}
