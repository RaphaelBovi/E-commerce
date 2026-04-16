// ─────────────────────────────────────────────────────────────────
// AuthResponse.java — DTO de resposta para autenticação (login/registro)
//
// Retornado pelos endpoints POST /api/auth/login e POST /api/auth/register
// após autenticação bem-sucedida. Contém o token JWT que o cliente deve
// enviar no header Authorization (Bearer <token>) em todas as requisições
// subsequentes que exijam autenticação.
//
// Para adicionar mais dados na resposta (ex.: nome do usuário):
//   1. Acrescente o campo aqui no record
//   2. Preencha-o em AuthService nos métodos login() e register()
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Entity.Dto;

public record AuthResponse(
        // Token JWT assinado — deve ser enviado pelo frontend em cada requisição autenticada
        // via header: Authorization: Bearer <token>
        String token,

        // E-mail do usuário autenticado — útil para o frontend exibir informações do usuário logado
        String email,

        // Role do usuário (ex.: "CUSTOMER", "ADMIN", "MASTER") —
        // permite ao frontend adaptar a interface conforme o nível de acesso
        String role
) {}
