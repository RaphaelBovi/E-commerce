package com.ecommerce.Auth.Entity.Dto;

// Returned by POST /api/auth/google.
// newUser=false → existing account, token/email/role filled.
// newUser=true  → first Google login, setupToken/email/fullName filled; token is null.
public record GoogleAuthResponse(
        boolean newUser,
        String token,
        String email,
        String role,
        String fullName,
        String setupToken
) {}
