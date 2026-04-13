package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres") String password
        @NotBlank String fullName,
        @NotBlank @cpf(message = "CPF inválido") String cpf,
        @NotBlank @birthDate(message = "Data de nascimento inválida") LocalDate birthDate,
        @NotBlank @Pattern(regexp = "\\d{10,11}", message = "Telefone inválido") String phone,
        @NotBlank String address,
        @NotBlank String city,
        @NotBlank String state,
        @NotBlank @zipCode(message = "CEP inválido") String zipCode
) {}