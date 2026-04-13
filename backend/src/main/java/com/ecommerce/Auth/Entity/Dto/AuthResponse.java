package com.ecommerce.Auth.Entity.Dto;

public record AuthResponse(
        String token,
        String email,
        String role
) {}