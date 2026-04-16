// ─────────────────────────────────────────────────────────────────
// LoginRequest.java — DTO (Data Transfer Object) para requisição de login
//
// Recebe as credenciais do usuário enviadas no corpo da requisição
// POST /api/auth/login. Usa Java Record para imutabilidade e
// anotações de validação Bean Validation para garantir dados válidos
// antes de chegar ao service.
//
// Para adicionar novos campos (ex.: código de MFA):
//   1. Acrescente o campo aqui com sua anotação de validação
//   2. Utilize o novo campo em AuthService.login()
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// record — classe imutável gerada pelo Java; os campos declarados são
// automaticamente construtor, getters, equals, hashCode e toString
public record LoginRequest(
        // @NotBlank — garante que o campo não seja nulo nem vazio
        // @Email     — valida o formato de e-mail (ex.: usuario@dominio.com)
        @NotBlank @Email String email,

        // @NotBlank — garante que a senha não seja vazia; a validação de força
        //             da senha ocorre somente no cadastro (RegisterRequest)
        @NotBlank String password
) {}
