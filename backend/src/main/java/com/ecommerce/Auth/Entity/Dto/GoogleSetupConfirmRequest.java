package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleSetupConfirmRequest(
        @NotBlank String email,
        @NotBlank String code,
        @NotBlank String setupToken
) {}
