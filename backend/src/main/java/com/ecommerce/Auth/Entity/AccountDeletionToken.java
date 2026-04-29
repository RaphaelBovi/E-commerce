package com.ecommerce.Auth.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

// Stores a hashed OTP for account deletion confirmation. Deleted after use or expiry.
// One token per email (PK = email) — new request replaces the old one.
@Entity
@Table(name = "account_deletion_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDeletionToken {

    @Id
    @Column(length = 320)
    private String email;

    @Column(nullable = false, length = 72)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private int attempts;
}
