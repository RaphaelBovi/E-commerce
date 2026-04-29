package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmDeletionRequest(@NotBlank String token) {}
