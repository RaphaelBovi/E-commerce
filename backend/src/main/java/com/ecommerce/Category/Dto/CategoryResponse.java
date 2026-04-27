package com.ecommerce.Category.Dto;

import com.ecommerce.Category.Category;
import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, String slug, boolean active, Instant createdAt) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.isActive(), c.getCreatedAt());
    }
}
