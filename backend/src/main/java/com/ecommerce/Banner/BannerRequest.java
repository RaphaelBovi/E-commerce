package com.ecommerce.Banner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BannerRequest(
        @NotBlank String title,
        String subtitle,
        String imageUrl,
        String linkUrl,
        @NotNull BannerPosition position,
        boolean active,
        int displayOrder
) {}
