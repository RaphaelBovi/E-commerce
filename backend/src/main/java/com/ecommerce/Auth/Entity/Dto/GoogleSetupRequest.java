package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleSetupRequest(
        @NotBlank String email,
        @NotBlank @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres") String password,
        String fullName,
        @NotBlank String setupToken
) {}
