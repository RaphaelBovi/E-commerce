package com.ecommerce.Auth.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

// Stores registration data + OTP hash while waiting for email verification.
// Deleted on confirm (success) or expiry (failure).
@Entity
@Table(name = "pending_registrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRegistration {

    @Id
    @Column(length = 320)
    private String email;

    @Column(nullable = false, length = 72)
    private String passwordHash;

    @Column(nullable = false, length = 72)
    private String otpHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private int attempts;

    @Column(nullable = false)
    private String fullName;

    @Column(length = 11)
    private String cpf;

    private LocalDate birthDate;

    @Column(length = 11)
    private String phone;

    private String address;
    private String city;

    @Column(length = 2)
    private String state;

    @Column(length = 8)
    private String zipCode;
}
