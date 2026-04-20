package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ConfirmRegistrationRequest(
        @NotBlank @Email String email,
        @NotBlank String code
) {}
