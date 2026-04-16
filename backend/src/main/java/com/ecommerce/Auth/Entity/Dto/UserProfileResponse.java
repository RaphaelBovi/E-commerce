// ─────────────────────────────────────────────────────────────────
// UserProfileResponse.java — DTO de resposta com o perfil completo do usuário
//
// Retornado pelo endpoint GET /api/auth/me (ou equivalente) para exibir
// todas as informações do usuário autenticado. Não expõe dados sensíveis
// como senha ou hash de senha — apenas campos seguros para o frontend.
//
// Para adicionar novos campos ao perfil:
//   1. Declare o campo aqui
//   2. Mapeie-o em AuthService (ou no método que monta este record)
//   3. Certifique-se de que o campo existe na entidade User
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Entity.Dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UserProfileResponse(
        // Identificador único do usuário (UUID gerado automaticamente pelo banco)
        UUID id,

        // E-mail do usuário — serve também como nome de usuário (login)
        String email,

        // Nome completo informado no cadastro
        String fullName,

        // CPF do usuário — armazenado como texto; único no sistema
        String cpf,

        // Data de nascimento do usuário
        LocalDate birthDate,

        // Telefone de contato
        String phone,

        // Endereço completo (logradouro, número, complemento)
        String address,

        // Cidade de residência
        String city,

        // Estado (UF) com 2 caracteres (ex.: "SP")
        String state,

        // CEP do endereço
        String zipCode,

        // Role do usuário como texto (ex.: "CUSTOMER", "ADMIN", "MASTER")
        String role,

        // Data e hora de criação da conta no formato ISO-8601 (fuso UTC)
        Instant createdAt
) {}
