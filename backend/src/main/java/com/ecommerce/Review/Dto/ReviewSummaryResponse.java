package com.ecommerce.Review.Dto;

import java.util.List;
import java.util.Map;

public record ReviewSummaryResponse(
        double averageRating,
        long totalCount,
        Map<Integer, Long> distribution, // star (1-5) → count
        List<ReviewResponse> reviews
) {}
