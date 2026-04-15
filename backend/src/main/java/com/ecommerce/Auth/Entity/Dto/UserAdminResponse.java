package com.ecommerce.Auth.Entity.Dto;

import java.time.Instant;
import java.util.UUID;

public record UserAdminResponse(
        UUID id,
        String email,
        String fullName,
        String role,
        Instant createdAt
) {}
