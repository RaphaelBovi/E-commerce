// ─────────────────────────────────────────────────────────────────
// UserAdminResponse.java — DTO de resposta para operações administrativas de usuário
//
// Retornado pelos endpoints de gerenciamento de admins:
//   - POST /api/admin/users  → dados do admin recém-criado
//   - GET  /api/admin/users  → lista de admins (ADMIN + MASTER)
//
// Expõe apenas os campos relevantes para gestão administrativa,
// sem dados pessoais sensíveis como CPF, endereço ou data de nascimento.
//
// Para incluir mais campos na resposta (ex.: telefone do admin):
//   1. Declare o campo aqui
//   2. Mapeie-o em AdminUserService nos métodos createAdmin() e listAdmins()
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Entity.Dto;

import java.time.Instant;
import java.util.UUID;

public record UserAdminResponse(
        // Identificador único do usuário (UUID gerado pelo banco)
        UUID id,

        // E-mail do administrador — usado como login
        String email,

        // Nome completo do administrador
        String fullName,

        // Role do usuário como texto (ex.: "ADMIN", "MASTER")
        String role,

        // Data e hora de criação da conta em UTC (ISO-8601)
        Instant createdAt
) {}
