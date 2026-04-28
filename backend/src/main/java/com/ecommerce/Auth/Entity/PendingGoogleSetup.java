package com.ecommerce.Auth.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "pending_google_setups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingGoogleSetup {

    @Id
    @Column(length = 320)
    private String email;

    @Column(nullable = false)
    private String fullName;

    private String passwordHash;

    private String otpHash;

    @Column(nullable = false)
    private String setupToken;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private int attempts;
}
