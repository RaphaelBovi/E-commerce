package com.ecommerce.Auth.Entity.Dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String fullName,
        String cpf,
        LocalDate birthDate,
        String phone,
        String address,
        String city,
        String state,
        String zipCode,
        String role,
        Instant createdAt
) {}
