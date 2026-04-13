package com.ecommerce.Product.Exception;

import java.time.Instant;

public record ApiError(
    String timestamp,
    int status,
    String error,
    String message
) {
    public static ApiError of(int status, String error, String message) {
        return new ApiError(Instant.now().toString(), status, error, message);
    }
}
