package com.ecommerce.Review.Dto;

import jakarta.validation.constraints.*;

public record CreateReviewRequest(
        @NotNull @Min(1) @Max(5) Integer rating,
        @Size(max = 1000) String comment
) {}
