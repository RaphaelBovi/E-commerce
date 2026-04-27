package com.ecommerce.Review.Dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID productId,
        String userEmail,
        String userFullName,
        int rating,
        String comment,
        Instant createdAt
) {}
