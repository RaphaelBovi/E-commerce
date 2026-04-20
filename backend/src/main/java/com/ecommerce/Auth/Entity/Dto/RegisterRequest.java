// ─────────────────────────────────────────────────────────────────
// RegisterRequest.java — DTO para requisição de cadastro de novo usuário
//
// Carrega todos os dados necessários para criar uma conta de cliente
// via POST /api/auth/register. As validações Bean Validation são
// verificadas automaticamente pelo Spring antes de o service ser invocado.
//
// Regras de senha aplicadas aqui:
//   - Mínimo 12 caracteres
//   - Deve conter: maiúscula, minúscula, número e caractere especial
//
// Para adicionar novos campos ao cadastro (ex.: apelido):
//   1. Declare o campo aqui com as anotações de validação necessárias
//   2. Mapeie-o em AuthService.register() para a entidade User
//   3. Adicione a coluna correspondente na entidade User e gere a migration
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterRequest(
        // E-mail do usuário — deve ser único no sistema; validado contra duplicatas em AuthService
        @NotBlank @Email String email,

        // Senha do usuário — será criptografada com BCrypt antes de ser persistida
        @NotBlank @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres") String password,

        // Nome completo do cliente
        @NotBlank String fullName,

        // CPF do cliente — validado contra duplicatas em AuthService; formato livre (sem máscara obrigatória)
        @NotBlank String cpf,

        // Data de nascimento — @Past garante que seja uma data anterior à atual
        @NotNull @Past(message = "Data de nascimento inválida") LocalDate birthDate,

        // Telefone de contato do cliente
        @NotBlank String phone,

        // Endereço completo (logradouro + número + complemento)
        @NotBlank String address,

        // Cidade de residência do cliente
        @NotBlank String city,

        // Estado (UF) — restrito a 2 caracteres (ex.: SP, RJ, MG)
        @NotBlank @Size(min = 2, max = 2) String state,

        // CEP do endereço
        @NotBlank String zipCode
) {}
