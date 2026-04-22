package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank(message = "Nome completo é obrigatório")
        String fullName,

        // CPF aceito apenas quando o usuário ainda não tem um cadastrado (ex.: conta Google)
        String cpf,

        String phone,

        LocalDate birthDate,

        String address,

        String city,

        @Size(min = 2, max = 2, message = "UF deve ter 2 letras")
        String state,

        String zipCode
) {}
