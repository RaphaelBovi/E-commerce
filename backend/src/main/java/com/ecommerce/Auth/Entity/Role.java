// ─────────────────────────────────────────────────────────────────
// Role.java — Enum de papéis (perfis) de usuário no sistema
//
// Define os níveis de acesso disponíveis na aplicação.
// Usado como atributo na entidade User e armazenado como texto (STRING)
// no banco de dados via @Enumerated(EnumType.STRING).
//
// Hierarquia de permissões (do menor para o maior):
//   CUSTOMER → usuário comum, pode criar pedidos e ver seu próprio perfil
//   ADMIN    → administrador, pode gerenciar produtos e pedidos
//   MASTER   → superadmin, pode criar/listar outros admins
//
// Para adicionar um novo papel:
//   1. Insira o novo valor aqui (ex.: SUPPORT)
//   2. Ajuste as regras de acesso em SecurityConfig (.hasRole / .hasAnyRole)
//   3. Inclua o novo papel nos métodos relevantes de AdminUserService, se necessário
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Entity;

public enum Role {
    // Papel padrão atribuído a usuários que se registram pelo endpoint público /api/auth/register
    CUSTOMER,

    // Papel administrativo criado via /api/admin/users (requer autenticação MASTER)
    ADMIN,

    // Papel de superadministrador; criado pelo AdminDataInitializer na inicialização da aplicação
    MASTER
}
