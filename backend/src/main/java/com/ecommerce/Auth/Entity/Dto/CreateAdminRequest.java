// ─────────────────────────────────────────────────────────────────
// CreateAdminRequest.java — DTO para criação de um novo usuário ADMIN
//
// Enviado no corpo da requisição POST /api/admin/users.
// Mais simples que RegisterRequest pois admins não precisam de CPF,
// endereço, etc. — apenas nome, e-mail e senha.
//
// A senha é validada com as mesmas regras de segurança do registro
// convencional (mínimo 12 caracteres). A criptografia com BCrypt
// é aplicada em AdminUserService antes de persistir.
//
// Para exigir campos extras ao criar um admin (ex.: departamento):
//   1. Adicione o campo aqui com as validações necessárias
//   2. Mapeie-o em AdminUserService.createAdmin()
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Entity.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAdminRequest(
        // Nome completo do administrador — campo obrigatório
        @NotBlank(message = "Nome é obrigatório") String fullName,

        // E-mail do administrador — deve ser único no sistema e ter formato válido
        @Email(message = "E-mail inválido") @NotBlank(message = "E-mail é obrigatório") String email,

        // Senha do administrador — mínimo 12 caracteres; será hasheada com BCrypt antes de salvar
        @NotBlank(message = "Senha é obrigatória") @Size(min = 12, message = "Senha deve ter no mínimo 12 caracteres") String password
) {}
