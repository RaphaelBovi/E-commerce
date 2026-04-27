package com.ecommerce.Banner;

import java.time.Instant;
import java.util.UUID;

public record BannerDto(
        UUID id,
        String title,
        String subtitle,
        String imageUrl,
        String linkUrl,
        BannerPosition position,
        boolean active,
        int displayOrder,
        Instant createdAt
) {
    public static BannerDto from(Banner b) {
        return new BannerDto(b.getId(), b.getTitle(), b.getSubtitle(), b.getImageUrl(),
                b.getLinkUrl(), b.getPosition(), b.isActive(), b.getDisplayOrder(), b.getCreatedAt());
    }
}
