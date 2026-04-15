package com.ecommerce.Auth.Controller;

// ─────────────────────────────────────────────────────────────────
// AuthController.java — Endpoints de autenticação
//
// Rota base: /api/auth
// Todos os endpoints aqui são públicos (não exigem token JWT).
// Exceção: GET /api/auth/me exige token, mas é liberado pelo filtro JWT.
// ─────────────────────────────────────────────────────────────────

import com.ecommerce.Auth.Entity.Dto.AuthResponse;
import com.ecommerce.Auth.Entity.Dto.LoginRequest;
import com.ecommerce.Auth.Entity.Dto.RegisterRequest;
import com.ecommerce.Auth.Entity.Dto.UserProfileResponse;
import com.ecommerce.Auth.Service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// @RestController — combina @Controller + @ResponseBody
// Indica que este classe responde requisições HTTP e retorna JSON automaticamente
// @RequestMapping — prefixo de rota para todos os endpoints desta classe
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService; // serviço com a lógica de negócio

    // ── POST /api/auth/register ───────────────────────────────────
    // Cadastra um novo cliente no sistema
    // @Valid — aciona as validações do Bean Validation nos campos do RegisterRequest
    // @ResponseStatus(CREATED) — retorna HTTP 201 em vez do padrão 200
    // Para alterar campos obrigatórios: edite RegisterRequest.java
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    // ── POST /api/auth/login ──────────────────────────────────────
    // Autentica um usuário existente e retorna um token JWT
    // Retorna: { token, email, role }
    // O token deve ser enviado nas próximas requisições via header: Authorization: Bearer <token>
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // ── GET /api/auth/me ──────────────────────────────────────────
    // Retorna os dados do usuário autenticado (precisa de token JWT válido)
    // Útil para preencher a página de perfil no frontend
    // Para adicionar/remover campos retornados: edite UserProfileResponse.java
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile() {
        return ResponseEntity.ok(authService.getProfile());
    }
}
