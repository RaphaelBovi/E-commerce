package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres") String password,
        @NotBlank String fullName,
        @NotBlank String cpf,
        @NotNull @Past(message = "Data de nascimento inválida") LocalDate birthDate,
        @NotBlank String phone,
        @NotBlank String address,
        @NotBlank String city,
        @NotBlank @Size(min = 2, max = 2) String state,
        @NotBlank String zipCode
) {}
